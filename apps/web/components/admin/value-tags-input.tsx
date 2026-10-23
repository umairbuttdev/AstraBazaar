"use client";

import { useState } from "react";

const fieldClass =
  "mt-2 w-full border border-ink/15 bg-foam px-4 py-3 text-ink outline-none transition focus:border-copper";

const fieldErrorClass =
  "mt-2 w-full border border-red-500 bg-red-50 px-4 py-3 text-ink outline-none transition focus:border-red-600";

const COMMON_SIZES = [
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
];

function parseTokens(raw: string) {
  return [
    ...new Set(
      raw
        .split(/[\n,|/]+/)
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ];
}

type ValueTagsInputProps = {
  name: string;
  values: string[];
  onChange: (values: string[]) => void;
  /** Show quick-pick size buttons (shoe-style sizes). */
  showSizePresets?: boolean;
  placeholder?: string;
  invalid?: boolean;
};

/**
 * Reliable multi-value entry: add one tag at a time with Add / Enter.
 * Hidden field still submits comma-joined values for the API expander.
 */
export function ValueTagsInput({
  name,
  values,
  onChange,
  showSizePresets = false,
  placeholder = "Type a value and press Add",
  invalid = false,
}: ValueTagsInputProps) {
  const [draft, setDraft] = useState("");

  function addTokens(raw: string) {
    const next = parseTokens(raw);
    if (next.length === 0) return;
    onChange([
      ...values,
      ...next.filter(
        (value) =>
          !values.some((item) => item.toLowerCase() === value.toLowerCase()),
      ),
    ]);
    setDraft("");
  }

  function removeValue(value: string) {
    onChange(values.filter((item) => item !== value));
  }

  function togglePreset(value: string) {
    if (values.some((item) => item.toLowerCase() === value.toLowerCase())) {
      removeValue(values.find((item) => item.toLowerCase() === value.toLowerCase())!);
      return;
    }
    onChange([...values, value]);
  }

  return (
    <div
      className={`mt-2 space-y-3 rounded-md ${
        invalid ? "ring-2 ring-red-500 ring-offset-2" : ""
      }`}
    >
      <input type="hidden" name={name} value={values.join(",")} />

      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {values.map((value) => (
            <li key={value}>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-ink/15 bg-foam px-2.5 py-1.5 text-sm font-semibold text-ink">
                {value}
                <button
                  type="button"
                  aria-label={`Remove ${value}`}
                  onClick={() => removeValue(value)}
                  className="text-ink-soft hover:text-red-800"
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={`text-xs ${invalid ? "text-red-800" : "text-ink-soft"}`}>
          {invalid ? "Add at least one value." : "No values added yet."}
        </p>
      )}

      {showSizePresets ? (
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-ink-soft uppercase">
            Quick sizes
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {COMMON_SIZES.map((size) => {
              const selected = values.some(
                (item) => item.toLowerCase() === size.toLowerCase(),
              );
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => togglePreset(size)}
                  className={`min-w-10 border px-2.5 py-1.5 text-sm font-semibold ${
                    selected
                      ? "border-ink bg-ink text-foam"
                      : "border-ink/15 bg-foam text-ink hover:border-copper"
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTokens(draft);
            }
          }}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          className={`${invalid ? fieldErrorClass : fieldClass} mt-0 min-w-[10rem] flex-1`}
        />
        <button
          type="button"
          onClick={() => addTokens(draft)}
          className="border border-ink/15 bg-foam px-4 py-3 text-sm font-semibold text-ink hover:border-copper"
        >
          Add
        </button>
      </div>
      <p className="text-xs text-ink-soft">
        Add one value at a time, then click Add (or press Enter). You can also
        paste several values and we will split them for you.
      </p>
    </div>
  );
}

export function isMultiValueChoiceLabel(name: string) {
  return /^(size|eu|uk|us|length|fit|volume|capacity|pack)$/i.test(name.trim());
}

export function splitStoredValues(raw: string) {
  return parseTokens(raw);
}
