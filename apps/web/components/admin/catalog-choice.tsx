"use client";

import { useMemo, useRef, useState } from "react";
import {
  buildCategoryTree,
  categoryOptionLabel,
  flattenCategoryTree,
} from "@/lib/category-tree";

const fieldClass =
  "mt-2 w-full border border-ink/15 bg-foam px-3 py-2 text-sm text-ink outline-none transition focus:border-copper";

const fieldErrorClass =
  "mt-2 w-full border border-red-500 bg-red-50 px-3 py-2 text-sm text-ink outline-none transition focus:border-red-600";

type Option = { id: string; name: string; parentId?: string | null };

export function CatalogChoice({
  label,
  name,
  options,
  nested = false,
  defaultValue = "",
  invalid = false,
  createAction,
}: {
  label: string;
  name: string;
  options: Option[];
  nested?: boolean;
  defaultValue?: string;
  invalid?: boolean;
  createAction: (formData: FormData) => Promise<{ id: string; name: string } | { error: string }>;
}) {
  const [items, setItems] = useState(options);
  const ordered = useMemo(
    () => flattenCategoryTree(buildCategoryTree(items)),
    [items],
  );
  const [selected, setSelected] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const parentRef = useRef<HTMLSelectElement>(null);

  async function create() {
    const entryName = nameRef.current?.value.trim() ?? "";
    if (!entryName) {
      setError(`Enter a ${label.toLowerCase()} name.`);
      return;
    }
    const parentId = parentRef.current?.value || null;
    const data = new FormData();
    data.set("name", entryName);
    if (parentId) data.set("parentId", parentId);
    setPending(true);
    setError("");
    const result = await createAction(data);
    setPending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setItems((current) => [...current, { ...result, parentId }]);
    setSelected(result.id);
    setOpen(false);
  }

  return (
    <div>
      <div className="flex items-end gap-2">
        <label className="block min-w-0 flex-1">
          <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">{label}</span>
          <select
            name={name}
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className={invalid ? fieldErrorClass : fieldClass}
            aria-invalid={invalid || undefined}
          >
            <option value="">None</option>
            {ordered.map((item) => (
              <option key={item.id} value={item.id}>
                {categoryOptionLabel(item)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => {
            setOpen((value) => !value);
            setError("");
          }}
          className="shrink-0 border border-ink/15 px-3 py-2 text-sm font-semibold text-ink hover:border-copper"
        >
          {open ? "Close" : "New"}
        </button>
      </div>
      {open ? (
        <div className="mt-3 space-y-3 border border-ink/10 bg-foam p-3">
          <label className="block">
            <span className="text-xs font-semibold tracking-[0.14em] text-ink-soft uppercase">
              {label} name
            </span>
            <input
              ref={nameRef}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void create();
                }
              }}
              className={fieldClass}
            />
          </label>
          {nested ? (
            <label className="block">
              <span className="text-xs font-semibold tracking-[0.14em] text-ink-soft uppercase">
                Parent category
              </span>
              <select ref={parentRef} defaultValue="" className={fieldClass}>
                <option value="">None — shows in the header</option>
                {ordered.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.path}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-ink-soft">
                Leave this empty for a header category. Choose one to add a subcategory under it.
              </span>
            </label>
          ) : null}
          {error ? (
            <p className="text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={() => void create()}
            className="bg-ink px-4 py-2 text-sm font-semibold text-foam hover:bg-copper disabled:opacity-60"
          >
            {pending ? "Saving…" : `Save ${label.toLowerCase()}`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
