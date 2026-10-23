"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateProfileAction } from "@/app/account/actions";

const fieldClass =
  "mt-2 w-full rounded-md border border-border bg-surface px-4 py-3 text-foreground outline-none transition focus:border-primary";

export function ProfileForm({
  email,
  fullName,
}: {
  email: string;
  fullName: string | null;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, null);

  return (
    <form action={action} className="max-w-xl space-y-5">
      <div>
        <p className="text-sm font-medium">Email</p>
        <p className="mt-2 text-ink">{email}</p>
        <p className="mt-1 text-sm text-ink-soft">
          This is the email you use to sign in. Changing it is not available here.
        </p>
      </div>
      <label className="block">
        <span className="text-sm font-medium">
          Full name <span className="text-ink-soft">(optional)</span>
        </span>
        <input
          type="text"
          name="fullName"
          autoComplete="name"
          maxLength={120}
          defaultValue={fullName ?? ""}
          className={fieldClass}
        />
      </label>
      {state?.error ? (
        <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Profile saved.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam hover:bg-copper disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
        <Link
          href="/account"
          className="inline-flex border border-ink/15 px-5 py-3 text-sm font-semibold text-ink"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
