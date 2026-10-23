"use client";

import Link from "next/link";
import { useState } from "react";
import {
  flattenCategoryTree,
  type CategoryNode,
} from "@/lib/category-tree";

const itemClass =
  "inline-flex shrink-0 items-center gap-1 text-xs font-semibold tracking-[0.12em] uppercase transition-colors hover:text-primary";

export function CategoryNav({ categories }: { categories: CategoryNode[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = categories.find((category) => category.id === openId) ?? null;

  return (
    <div
      className="relative"
      onMouseLeave={() => setOpenId(null)}
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
          setOpenId(null);
        }
      }}
    >
      <ul className="container-page flex items-center gap-5 overflow-x-auto py-2.5 scrollbar-none">
        <li onMouseEnter={() => setOpenId(null)}>
          <Link href="/" className={`${itemClass} text-foreground`}>
            Home
          </Link>
        </li>
        {categories.map((category) => {
          const hasChildren = category.children.length > 0;
          const expanded = openId === category.id;
          return (
            <li
              key={category.id}
              onMouseEnter={() => setOpenId(hasChildren ? category.id : null)}
            >
              <Link
                href={`/categories/${category.slug}`}
                className={`${itemClass} ${expanded ? "text-primary" : "text-foreground"}`}
                aria-expanded={hasChildren ? expanded : undefined}
                onFocus={() => setOpenId(hasChildren ? category.id : null)}
              >
                {category.name}
                {hasChildren ? (
                  <span aria-hidden className="text-[10px]">
                    ▾
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
        {categories.length === 0 ? (
          <li>
            <Link href="/products" className={`${itemClass} text-foreground`}>
              All products
            </Link>
          </li>
        ) : null}
      </ul>

      {open && open.children.length > 0 ? (
        <div className="absolute inset-x-0 top-full z-50 border-y border-border bg-surface shadow-md">
          <div className="container-page grid max-h-[70vh] grid-cols-2 gap-x-8 gap-y-6 overflow-y-auto py-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {open.children.map((child) => {
              const links = flattenCategoryTree(child.children);
              return (
                <div key={child.id}>
                  <Link
                    href={`/categories/${child.slug}`}
                    className="text-sm font-semibold text-foreground hover:text-primary"
                    onClick={() => setOpenId(null)}
                  >
                    {child.name}
                  </Link>
                  {links.length > 0 ? (
                    <ul className="mt-2 space-y-1.5">
                      {links.map((link) => (
                        <li key={link.id}>
                          <Link
                            href={`/categories/${link.slug}`}
                            onClick={() => setOpenId(null)}
                            className={`block text-sm text-foreground-muted hover:text-primary ${link.depth > 0 ? "pl-3" : ""}`}
                          >
                            {link.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
