import Link from "next/link";

export function AdminPager({
  page,
  totalPages,
  href,
}: {
  page: number;
  totalPages: number;
  href: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label="Pages" className="mt-6 flex items-center justify-between text-sm">
      {page > 1 ? (
        <Link href={href(page - 1)} className="font-semibold underline underline-offset-4">
          Previous
        </Link>
      ) : (
        <span className="text-ink-soft">Previous</span>
      )}
      <p className="text-ink-soft">
        Page {page} of {totalPages}
      </p>
      {page < totalPages ? (
        <Link href={href(page + 1)} className="font-semibold underline underline-offset-4">
          Next
        </Link>
      ) : (
        <span className="text-ink-soft">Next</span>
      )}
    </nav>
  );
}
