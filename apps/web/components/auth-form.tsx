import Link from "next/link";
import { signIn, signUp } from "@/app/auth/actions";
import { safeNext } from "@/lib/safe-next";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
  error?: string;
  message?: string;
  next?: string;
};

export function AuthForm({ mode, error, message, next }: AuthFormProps) {
  const action = mode === "signup" ? signUp : signIn;
  const returnTo = safeNext(next);

  return (
    <form action={action} className="mx-auto w-full max-w-md space-y-5">
      <input type="hidden" name="next" value={returnTo} />
      {mode === "signup" ? (
        <label className="block">
          <span className="text-sm text-ink-soft">Full name</span>
          <input
            type="text"
            name="fullName"
            className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
            autoComplete="name"
          />
        </label>
      ) : null}

      <label className="block">
        <span className="text-sm text-ink-soft">Email</span>
        <input
          type="email"
          name="email"
          required
          className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
          autoComplete="email"
        />
      </label>

      <label className="block">
        <span className="text-sm text-ink-soft">Password</span>
        <input
          type="password"
          name="password"
          required
          minLength={6}
          className="mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
      </label>

      {error ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="border border-copper/30 bg-copper/10 px-4 py-3 text-sm text-ink">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        className="w-full bg-ink px-5 py-3 text-sm font-semibold tracking-wide text-foam transition-colors hover:bg-copper"
      >
        {mode === "signup" ? "Create account" : "Sign in"}
      </button>

      <p className="text-sm text-ink-soft">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-ink underline underline-offset-4">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to AstraBazaar?{" "}
            <Link
              href={returnTo === "/" ? "/signup" : `/signup?next=${encodeURIComponent(returnTo)}`}
              className="text-ink underline underline-offset-4"
            >
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
