"use client";

import { useState } from "react";

type CopyTextProps = {
  value: string;
  label?: string;
};

export function CopyText({ value, label = "Copy" }: CopyTextProps) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="text-sm font-semibold text-copper underline-offset-4 hover:underline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
    >
      {copied ? "Copied" : label}
    </button>
  );
}
