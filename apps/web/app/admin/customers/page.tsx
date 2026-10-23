import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminPager } from "@/components/admin/admin-pager";
import { adminListCustomers } from "@/lib/admin-api";
import { formatOrderDate } from "@/lib/order-types";

function listHref(q: string | undefined, page: number) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const text = params.toString();
  return text ? `/admin/customers?${text}` : "/admin/customers";
}

async function CustomersContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await connection();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  let customers = null;
  try {
    customers = await adminListCustomers({ page, q: params.q });
  } catch {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Customers</h1>
        <p className="mt-3 text-sm text-ink-soft">Unable to load customers.</p>
        <Link href="/admin/customers" className="mt-4 inline-flex text-sm font-semibold underline">Retry</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Customers</h1>
      <p className="mt-1 text-sm text-ink-soft">{customers.total} profiles</p>
      <form className="mt-4 flex flex-wrap gap-3">
        <input name="q" defaultValue={params.q ?? ""} placeholder="Name or email" className="rounded-md border border-ink/15 bg-foam px-3 py-2 text-sm" />
        <button className="bg-ink px-4 py-2 text-sm font-semibold text-foam">Search</button>
      </form>
      <div className="mt-4 overflow-x-auto rounded-xl border border-ink/10 bg-foam">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="border-b border-ink/10 text-xs text-ink-soft uppercase">
            <tr>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Orders</th>
              <th className="px-4 py-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.items.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-6 text-ink-soft">No customers in this view.</td></tr>
            ) : customers.items.map((customer) => (
              <tr key={customer.id} className="border-b border-ink/5">
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${customer.id}`} className="font-semibold underline-offset-4 hover:underline">
                    {customer.fullName || customer.email}
                  </Link>
                  <p className="text-xs text-ink-soft">{customer.email}</p>
                </td>
                <td className="px-4 py-3">{customer.role.toLowerCase()}</td>
                <td className="px-4 py-3">{customer._count.orders}</td>
                <td className="px-4 py-3">{formatOrderDate(customer.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminPager page={customers.page} totalPages={customers.totalPages} href={(next) => listHref(params.q, next)} />
    </div>
  );
}

export default function AdminCustomersPage(props: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-ink-soft">Loading customers...</p>}>
      <CustomersContent {...props} />
    </Suspense>
  );
}
