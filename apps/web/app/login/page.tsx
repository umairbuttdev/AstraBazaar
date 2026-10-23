import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string; next?: string }>;
};

async function LoginContent({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <>
      <div className="mb-10 max-w-md">
        <p className="text-sm tracking-[0.2em] text-copper uppercase">Account</p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
          Sign in
        </h1>
        <p className="mt-4 text-ink-soft">
          Access your AstraBazaar account for profile, addresses, wishlist, cart, and orders.
        </p>
      </div>
      <AuthForm
        mode="login"
        error={params.error}
        message={params.message}
        next={params.next}
      />
    </>
  );
}

export default function LoginPage(props: LoginPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 py-16 md:px-10">
      <Suspense fallback={<p className="text-ink-soft">Loading...</p>}>
        <LoginContent {...props} />
      </Suspense>
    </main>
  );
}
