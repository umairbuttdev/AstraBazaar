import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export const metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

type SignUpPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

async function SignUpContent({ searchParams }: SignUpPageProps) {
  const params = await searchParams;

  return (
    <>
      <div className="mb-10 max-w-md">
        <p className="text-sm tracking-[0.2em] text-copper uppercase">Account</p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
          Create account
        </h1>
        <p className="mt-4 text-ink-soft">
          Join AstraBazaar to save your cart and complete checkout later.
        </p>
      </div>
      <AuthForm
        mode="signup"
        error={params.error}
        message={params.message}
      />
    </>
  );
}

export default function SignUpPage(props: SignUpPageProps) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 py-16 md:px-10">
      <Suspense fallback={<p className="text-ink-soft">Loading...</p>}>
        <SignUpContent {...props} />
      </Suspense>
    </main>
  );
}
