import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ProfileForm } from "@/components/account/profile-form";
import { getAccountProfile } from "@/lib/account-api";

export const metadata = { title: "Profile" };

async function ProfileContent() {
  await connection();
  let profile = null;
  let loadError: string | null = null;
  try {
    profile = await getAccountProfile();
  } catch {
    loadError = "Unable to load your profile right now.";
  }

  if (loadError) {
    return (
      <div>
        <h2 className="font-display text-3xl text-ink">Profile</h2>
        <p className="mt-3 text-ink-soft">{loadError}</p>
        <Link href="/account/profile" className="mt-6 inline-flex text-sm font-semibold underline underline-offset-4">
          Try again
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <h2 className="font-display text-3xl text-ink">Profile</h2>
        <p className="mt-3 text-ink-soft">Login to edit your profile.</p>
        <Link
          href="/login?next=%2Faccount%2Fprofile"
          className="mt-6 inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam hover:bg-copper"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-3xl text-ink">Profile</h2>
      <p className="mt-3 max-w-xl text-ink-soft">
        Update the name shown on your account. Your sign-in email stays with your authentication account.
      </p>
      <div className="mt-8">
        <ProfileForm email={profile.email} fullName={profile.fullName} />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading profile...</p>}>
      <ProfileContent />
    </Suspense>
  );
}
