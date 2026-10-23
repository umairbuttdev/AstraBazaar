import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminProfile } from "@/lib/profile";

export const metadata = {
  title: "Operations",
  robots: { index: false, follow: false },
};

async function AdminFrame({ children }: { children: React.ReactNode }) {
  const { profile, reason } = await requireAdminProfile();

  if (reason === "UNAUTHORIZED") {
    redirect(
      `/login?next=${encodeURIComponent("/admin")}&error=${encodeURIComponent("Please login as an admin.")}`,
    );
  }
  if (reason === "FORBIDDEN" || !profile) {
    redirect("/");
  }

  return <AdminShell email={profile.email}>{children}</AdminShell>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<p className="px-6 py-10 text-sm text-ink-soft">Loading operations...</p>}>
      <AdminFrame>{children}</AdminFrame>
    </Suspense>
  );
}
