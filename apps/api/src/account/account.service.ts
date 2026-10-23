import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { User } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service.js';
import { parseAddress, parseFullName } from './account.rules.js';

function serializeAddress(address: {
  id: string;
  label: string | null;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
}) {
  return {
    id: address.id,
    label: address.label,
    fullName: address.fullName,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    phone: address.phone,
    isDefault: address.isDefault,
  };
}

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureProfile(user: User) {
    if (!user.email) {
      throw new BadRequestException('Authenticated user has no email');
    }

    return this.prisma.profile.upsert({
      where: { id: user.id },
      update: { email: user.email },
      create: {
        id: user.id,
        email: user.email,
        fullName:
          typeof user.user_metadata?.full_name === 'string'
            ? user.user_metadata.full_name
            : null,
      },
    });
  }

  async getProfile(user: User) {
    const profile = await this.ensureProfile(user);
    return {
      email: profile.email,
      fullName: profile.fullName,
    };
  }

  async updateProfile(user: User, input: { fullName?: unknown }) {
    const profile = await this.ensureProfile(user);
    const parsed = parseFullName(input.fullName);
    if (parsed && typeof parsed === 'object') {
      throw new BadRequestException(parsed.error);
    }

    const updated = await this.prisma.profile.update({
      where: { id: profile.id },
      data: { fullName: parsed },
    });

    return {
      email: updated.email,
      fullName: updated.fullName,
    };
  }

  async summary(user: User) {
    const profile = await this.ensureProfile(user);
    const [wishlistCount, addresses, defaultAddress] = await Promise.all([
      this.prisma.wishlistItem.count({
        where: { wishlist: { profileId: profile.id } },
      }),
      this.prisma.address.count({ where: { profileId: profile.id } }),
      this.prisma.address.findFirst({
        where: { profileId: profile.id, isDefault: true },
      }),
    ]);

    return {
      email: profile.email,
      fullName: profile.fullName,
      wishlistCount,
      addressCount: addresses,
      defaultAddress: defaultAddress ? serializeAddress(defaultAddress) : null,
    };
  }

  async listAddresses(user: User) {
    const profile = await this.ensureProfile(user);
    const addresses = await this.prisma.address.findMany({
      where: { profileId: profile.id },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
    return addresses.map(serializeAddress);
  }

  async getAddress(user: User, addressId: string) {
    const profile = await this.ensureProfile(user);
    const address = await this.ownedAddress(profile.id, addressId);
    return serializeAddress(address);
  }

  async createAddress(user: User, input: Record<string, unknown>) {
    const profile = await this.ensureProfile(user);
    const parsed = this.addressOrThrow(input);

    const created = await this.prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { profileId: profile.id } });
      const isDefault = count === 0 || parsed.isDefault;
      if (isDefault) {
        await tx.address.updateMany({
          where: { profileId: profile.id, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.address.create({
        data: {
          profileId: profile.id,
          label: parsed.label,
          fullName: parsed.fullName,
          line1: parsed.line1,
          line2: parsed.line2,
          city: parsed.city,
          state: parsed.state,
          postalCode: parsed.postalCode,
          country: parsed.country,
          phone: parsed.phone,
          isDefault,
        },
      });
    });

    return serializeAddress(created);
  }

  async updateAddress(
    user: User,
    addressId: string,
    input: Record<string, unknown>,
  ) {
    const profile = await this.ensureProfile(user);
    await this.ownedAddress(profile.id, addressId);
    const parsed = this.addressOrThrow(input);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (parsed.isDefault) {
        await tx.address.updateMany({
          where: { profileId: profile.id, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.address.update({
        where: { id: addressId },
        data: {
          label: parsed.label,
          fullName: parsed.fullName,
          line1: parsed.line1,
          line2: parsed.line2,
          city: parsed.city,
          state: parsed.state,
          postalCode: parsed.postalCode,
          country: parsed.country,
          phone: parsed.phone,
          isDefault: parsed.isDefault,
        },
      });
    });

    return serializeAddress(updated);
  }

  async setDefaultAddress(user: User, addressId: string) {
    const profile = await this.ensureProfile(user);
    await this.ownedAddress(profile.id, addressId);

    const address = await this.prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { profileId: profile.id, isDefault: true },
        data: { isDefault: false },
      });
      return tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });

    return serializeAddress(address);
  }

  async deleteAddress(user: User, addressId: string) {
    const profile = await this.ensureProfile(user);
    const existing = await this.ownedAddress(profile.id, addressId);

    await this.prisma.$transaction(async (tx) => {
      await tx.address.delete({ where: { id: existing.id } });
      if (existing.isDefault) {
        const next = await tx.address.findFirst({
          where: { profileId: profile.id },
          orderBy: { updatedAt: 'desc' },
        });
        if (next) {
          await tx.address.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return { ok: true, id: existing.id };
  }

  private addressOrThrow(input: Record<string, unknown>) {
    const parsed = parseAddress(input);
    if ('error' in parsed) {
      throw new BadRequestException(parsed.error);
    }
    return parsed.value;
  }

  private async ownedAddress(profileId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, profileId },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }
}
