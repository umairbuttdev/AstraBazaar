import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { requireAdminProfile } from "@/lib/profile";

export const metadata = {
  title: "Admin",
};

async function AdminShell({ children }: { children: React.ReactNode }) {
  const { reason } = await requireAdminProfile();

  if (reason === "UNAUTHORIZED") {
    redirect(
      `/login?error=${encodeURIComponent("Please login as an admin.")}`,
    );
  }
  if (reason === "FORBIDDEN") {
    redirect("/");
  }

  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 md:px-10">
      <div className="mb-10 flex flex-col gap-4 border-b border-ink/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm tracking-[0.2em] text-copper uppercase">Admin</p>
          <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">
            Store console
          </h1>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm text-ink-soft">
          <Link href="/admin" className="transition-colors hover:text-ink">
            Overview
          </Link>
          <Link
            href="/admin/products"
            className="transition-colors hover:text-ink"
          >
            Products
          </Link>
          <Link
            href="/admin/inventory"
            className="transition-colors hover:text-ink"
          >
            Inventory
          </Link>
          <Link
            href="/admin/orders"
            className="transition-colors hover:text-ink"
          >
            Orders
          </Link>
          <Link href="/" className="transition-colors hover:text-ink">
            Storefront
          </Link>
        </nav>
      </div>
      {children}
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10 md:px-10">
          <p className="text-ink-soft">Loading admin...</p>
        </main>
      }
    >
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
