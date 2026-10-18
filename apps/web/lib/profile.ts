import { PrismaClient, type UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@/lib/supabase/server";

function createPrisma() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export type ProfileSummary = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
};

export async function getCurrentProfile(): Promise<ProfileSummary | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const shouldBeAdmin = adminEmails().includes(user.email.toLowerCase());
  const prisma = createPrisma();

  try {
    const profile = await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        ...(shouldBeAdmin ? { role: "ADMIN" as const } : {}),
      },
      create: {
        id: user.id,
        email: user.email,
        fullName:
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : null,
        role: shouldBeAdmin ? "ADMIN" : "CUSTOMER",
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    return profile;
  } finally {
    await prisma.$disconnect();
  }
}

export async function requireAdminProfile() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return { profile: null, reason: "UNAUTHORIZED" as const };
  }
  if (profile.role !== "ADMIN") {
    return { profile, reason: "FORBIDDEN" as const };
  }
  return { profile, reason: null };
}
