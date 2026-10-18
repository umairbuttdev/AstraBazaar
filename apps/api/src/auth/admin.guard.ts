import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedRequest } from './auth.guard.js';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  private adminEmails() {
    return (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user?.id || !user.email) {
      throw new ForbiddenException('Admin access required');
    }

    const adminEmails = this.adminEmails();
    const shouldBeAdmin = adminEmails.includes(user.email.toLowerCase());

    const profile = await this.prisma.profile.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        ...(shouldBeAdmin ? { role: UserRole.ADMIN } : {}),
      },
      create: {
        id: user.id,
        email: user.email,
        fullName:
          typeof user.user_metadata?.full_name === 'string'
            ? user.user_metadata.full_name
            : null,
        role: shouldBeAdmin ? UserRole.ADMIN : UserRole.CUSTOMER,
      },
    });

    if (profile.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
