"use client";

import { useActionState } from "react";
import { updatePasswordAction } from "@/app/account/actions";

const fieldClass =
  "mt-2 w-full rounded-md border border-border bg-surface px-4 py-3 text-foreground outline-none transition focus:border-primary";

export function PasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, null);

  return (
    <form action={action} className="max-w-xl space-y-4">
      <label className="block">
        <span className="text-sm font-medium">
          Current password <span className="text-red-800">*</span>
        </span>
        <input
          type="password"
          name="currentPassword"
          autoComplete="current-password"
          required
          className={fieldClass}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">
          New password <span className="text-red-800">*</span>
        </span>
        <input
          type="password"
          name="nextPassword"
          autoComplete="new-password"
          required
          minLength={8}
          className={fieldClass}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">
          Confirm new password <span className="text-red-800">*</span>
        </span>
        <input
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={8}
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
          Password updated.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex bg-ink px-5 py-3 text-sm font-semibold text-foam hover:bg-copper disabled:opacity-50"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
