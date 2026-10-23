"use client";

import { useEffect, useRef, useState } from "react";

const MAX_IMAGES = 8;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type Preview = { file: File; url: string };

export function ImagePicker({
  name,
  label,
  hint,
}: {
  name: string;
  label: string;
  hint: string;
}) {
  const submitRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<Preview[]>([]);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, []);

  function commit(next: Preview[]) {
    const transfer = new DataTransfer();
    for (const preview of next) transfer.items.add(preview.file);
    if (submitRef.current) submitRef.current.files = transfer.files;
    const kept = new Set(next.map((preview) => preview.url));
    for (const preview of previewsRef.current) {
      if (!kept.has(preview.url)) URL.revokeObjectURL(preview.url);
    }
    previewsRef.current = next;
    setPreviews(next);
  }

  function addFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const next = [...previewsRef.current];
    let message = "";
    for (const file of list) {
      if (next.length >= MAX_IMAGES) {
        message = "You can add up to 8 images.";
        break;
      }
      if (!ALLOWED.has(file.type)) {
        message = "Use JPG, PNG, WEBP, or GIF images.";
        continue;
      }
      if (file.size > MAX_BYTES) {
        message = `${file.name} is larger than 5MB.`;
        continue;
      }
      next.push({ file, url: URL.createObjectURL(file) });
    }
    setError(message);
    commit(next);
  }

  return (
    <div>
      <span className="text-sm tracking-[0.14em] text-ink-soft uppercase">{label}</span>
      <input ref={submitRef} type="file" name={name} multiple className="hidden" tabIndex={-1} />
      <input
        ref={pickerRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => pickerRef.current?.click()}
        className="mt-2 border border-ink/15 px-4 py-2 text-sm font-semibold text-ink hover:border-copper"
      >
        Add images
      </button>
      <p className="mt-1 text-xs text-ink-soft">{hint}</p>
      {error ? <p className="mt-2 text-sm text-red-800">{error}</p> : null}
      {previews.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-3">
          {previews.map((preview) => (
            <li key={preview.url} className="w-24">
              {/* Local preview of a file the browser has not uploaded yet. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.url}
                alt=""
                className="h-24 w-24 border border-ink/10 object-cover"
              />
              <button
                type="button"
                onClick={() => commit(previewsRef.current.filter((item) => item.url !== preview.url))}
                className="mt-1 text-xs font-semibold text-ink underline underline-offset-4"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
