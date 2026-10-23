"use server";

import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { safeNext } from "@/lib/safe-next";
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

async function ensureProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return;
  }

  const prisma = createPrisma();
  try {
    await prisma.profile.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        fullName:
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : undefined,
      },
      create: {
        id: user.id,
        email: user.email,
        fullName:
          typeof user.user_metadata?.full_name === "string"
            ? user.user_metadata.full_name
            : null,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!email || !password) {
    redirect("/signup?error=Email%20and%20password%20are%20required.");
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || undefined,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (data.session) {
    await ensureProfile();
    redirect("/");
  }

  redirect(
    `/signup?message=${encodeURIComponent(
      "Account created. Confirm your email before signing in, or disable Confirm email in Supabase → Authentication → Providers → Email for local testing.",
    )}`,
  );
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=Email%20and%20password%20are%20required.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  const next = safeNext(formData.get("next"));

  if (error) {
    const message = error.message.toLowerCase().includes("email not confirmed")
      ? "Email not confirmed yet. Check your inbox, or disable Confirm email in Supabase Auth settings for local testing."
      : error.message;
    redirect(
      `/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(message)}`,
    );
  }

  await ensureProfile();
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

