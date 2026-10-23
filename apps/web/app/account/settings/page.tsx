import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { signOut } from "@/app/auth/actions";
import { PasswordForm } from "@/components/account/password-form";
import { getAccountProfile } from "@/lib/account-api";

export const metadata = { title: "Settings" };

async function SettingsContent() {
  await connection();
  let profile = null;
  try {
    profile = await getAccountProfile();
  } catch {
    return (
      <div>
        <h2 className="font-display text-3xl text-ink">Settings</h2>
        <p className="mt-3 text-ink-soft">Unable to load your account right now.</p>
        <Link href="/account/settings" className="mt-6 inline-flex text-sm font-semibold underline underline-offset-4">
          Try again
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <h2 className="font-display text-3xl text-ink">Settings</h2>
        <p className="mt-3 text-ink-soft">Login to manage your account.</p>
        <Link
          href="/login?next=%2Faccount%2Fsettings"
          className="mt-6 inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam hover:bg-copper"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="font-display text-3xl text-ink">Security</h2>
        <p className="mt-3 max-w-xl text-sm text-ink-soft">
          Password changes go through your sign-in account. AstraBazaar does not store your password.
        </p>
        <div className="mt-6">
          <PasswordForm />
        </div>
      </section>
      <section className="border-t border-ink/10 pt-8">
        <h2 className="font-display text-2xl text-ink">Session</h2>
        <p className="mt-3 text-sm text-ink-soft">Signed in as {profile.email}.</p>
        <form action={signOut} className="mt-4">
          <button
            type="submit"
            className="inline-flex border border-ink/15 px-5 py-3 text-sm font-semibold text-ink hover:border-copper"
          >
            Sign out
          </button>
        </form>
      </section>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="text-ink-soft">Loading settings...</p>}>
      <SettingsContent />
    </Suspense>
  );
}
