"use client";

import { DeleteConfirmButton } from "@/components/ui/confirm-dialog";

type DeleteAction = (formData: FormData) => void | Promise<void>;

export function DeleteProductButton({
  productId,
  productName,
  action,
  from = "detail",
}: {
  productId: string;
  productName: string;
  action: DeleteAction;
  from?: "list" | "detail";
}) {
  return (
    <DeleteConfirmButton
      action={action}
      fields={{ productId, from }}
      title="Delete product?"
      description={`Delete “${productName}” and all of its versions? This cannot be undone. Past orders keep the product name and price.`}
      confirmLabel="Delete product"
      cancelLabel="Keep product"
      trigger="Delete"
      triggerClassName="text-sm font-semibold text-red-800 underline underline-offset-4"
    />
  );
}

export function DeleteVariantButton({
  productId,
  variantId,
  label,
  action,
}: {
  productId: string;
  variantId: string;
  label: string;
  action: DeleteAction;
}) {
  return (
    <DeleteConfirmButton
      action={action}
      fields={{ productId, variantId }}
      title="Delete version?"
      description={`Delete version “${label}”? Past orders keep the name and price for this version.`}
      confirmLabel="Delete version"
      cancelLabel="Keep version"
      trigger="Delete version"
      triggerClassName="text-sm font-semibold text-red-800 underline underline-offset-4"
    />
  );
}
