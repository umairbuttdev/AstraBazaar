import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "neutral" | "primary" | "success" | "warning" | "error";
  className?: string;
};

const toneClasses = {
  neutral: "bg-surface-secondary text-foreground-muted",
  primary: "bg-primary/15 text-primary-hover",
  success: "bg-emerald-50 text-success",
  warning: "bg-amber-50 text-warning",
  error: "bg-red-50 text-error",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
