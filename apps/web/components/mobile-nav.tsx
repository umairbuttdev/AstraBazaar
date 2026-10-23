"use client";

import Link from "next/link";
import { useState } from "react";
import { SearchInput } from "@/components/ui/search-input";
import type { CategoryNode } from "@/lib/category-tree";

type NavLink = {
  href: string;
  label: string;
};

type MobileNavProps = {
  categories: CategoryNode[];
  extraLinks: NavLink[];
  accountLinks: NavLink[];
};

function CategoryBranch({
  category,
  depth,
  onNavigate,
}: {
  category: CategoryNode;
  depth: number;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = category.children.length > 0;

  return (
    <div>
      <div className="flex items-center" style={{ paddingLeft: depth * 12 }}>
        <Link
          href={`/categories/${category.slug}`}
          onClick={onNavigate}
          className="flex-1 rounded-md px-2 py-2.5 text-sm font-medium text-foreground hover:bg-surface-secondary"
        >
          {category.name}
        </Link>
        {hasChildren ? (
          <button
            type="button"
            aria-expanded={open}
            aria-label={`${open ? "Hide" : "Show"} ${category.name} subcategories`}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center text-foreground-muted"
          >
            <span aria-hidden>{open ? "▴" : "▾"}</span>
          </button>
        ) : null}
      </div>
      {open
        ? category.children.map((child) => (
            <CategoryBranch
              key={child.id}
              category={child}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))
        : null}
    </div>
  );
}

export function MobileNav({ categories, extraLinks, accountLinks }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground"
      >
        <span className="sr-only">{open ? "Close" : "Menu"}</span>
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden
        >
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <>
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </>
          )}
        </svg>
      </button>

      {open ? (
        <div
          id="mobile-nav-panel"
          className="absolute inset-x-0 top-full z-40 max-h-[80vh] overflow-y-auto border-b border-border bg-surface shadow-md"
        >
          <div className="container-page space-y-5 py-5">
            <SearchInput />
            <nav className="flex flex-col" aria-label="Mobile">
              <Link
                href="/"
                onClick={close}
                className="rounded-md px-2 py-2.5 text-sm font-medium text-foreground hover:bg-surface-secondary"
              >
                Home
              </Link>
              {categories.map((category) => (
                <CategoryBranch
                  key={category.id}
                  category={category}
                  depth={0}
                  onNavigate={close}
                />
              ))}
              {extraLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="rounded-md px-2 py-2.5 text-sm font-medium text-foreground hover:bg-surface-secondary"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-border pt-4">
              <p className="text-caption text-foreground-muted">Account</p>
              <div className="mt-2 flex flex-col gap-1">
                {accountLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={close}
                    className="rounded-md px-2 py-2.5 text-sm text-foreground hover:bg-surface-secondary"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
