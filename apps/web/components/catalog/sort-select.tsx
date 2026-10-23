"use client";

import { useRouter } from "next/navigation";
import { CATALOG_SORTS, catalogHref, type CatalogState } from "@/lib/catalog";

type SortSelectProps = {
  pathname: string;
  state: CatalogState;
  fixedCategory?: string;
  hasQuery: boolean;
};

export function SortSelect({
  pathname,
  state,
  fixedCategory,
  hasQuery,
}: SortSelectProps) {
  const router = useRouter();
  const value = state.sort ?? (hasQuery ? "relevance" : "newest");
  const options = CATALOG_SORTS.filter(
    (sort) => sort.value !== "relevance" || hasQuery,
  );

  return (
    <label className="inline-flex items-center gap-2 text-sm text-foreground-muted">
      <span className="sr-only">Sort products</span>
      <span aria-hidden>Sort</span>
      <select
        value={value}
        onChange={(event) => {
          const sort = event.target.value as CatalogState["sort"];
          router.push(
            catalogHref(
              pathname,
              state,
              { sort, page: 1 },
              fixedCategory,
            ),
          );
        }}
        className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
      >
        {options.map((sort) => (
          <option key={sort.value} value={sort.value}>
            {sort.label}
          </option>
        ))}
      </select>
    </label>
  );
}
