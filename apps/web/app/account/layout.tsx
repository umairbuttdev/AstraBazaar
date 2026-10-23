import { Suspense } from "react";
import { AccountFrame } from "@/components/account/account-frame";

export const metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="container-page flex-1 py-8 md:py-12">
      <Suspense fallback={<p className="text-ink-soft">Loading your account...</p>}>
        <AccountFrame>{children}</AccountFrame>
      </Suspense>
    </main>
  );
}
