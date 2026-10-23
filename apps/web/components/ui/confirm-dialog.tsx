"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Visual tone for the confirm action. */
  tone?: "danger" | "default";
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  tone = "danger",
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={onCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      className="w-[min(100%-2rem,26rem)] rounded-lg border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-ink/45"
    >
      <div className="p-5">
        <h2 id={titleId} className="text-lg font-semibold text-ink">
          {title}
        </h2>
        <p id={descriptionId} className="mt-3 text-sm leading-relaxed text-ink-soft">
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-ink hover:border-ink/40"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-semibold text-foam ${
              tone === "danger"
                ? "bg-red-800 hover:bg-red-900"
                : "bg-ink hover:bg-copper"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

type DeleteConfirmButtonProps = {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  trigger: ReactNode;
  triggerClassName?: string;
  triggerAriaLabel?: string;
  triggerTitle?: string;
};

/**
 * Opens a custom confirm modal, then submits a server-action form only after confirm.
 */
export function DeleteConfirmButton({
  action,
  fields,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Keep",
  trigger,
  triggerClassName,
  triggerAriaLabel,
  triggerTitle,
}: DeleteConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <button
        type="button"
        aria-label={triggerAriaLabel}
        title={triggerTitle}
        className={triggerClassName}
        onClick={() => setOpen(true)}
      >
        {trigger}
      </button>
      <form ref={formRef} action={action} className="hidden" aria-hidden>
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      </form>
      <ConfirmDialog
        open={open}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        cancelLabel={cancelLabel}
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
