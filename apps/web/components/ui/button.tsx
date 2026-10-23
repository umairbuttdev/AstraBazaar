import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-foam hover:bg-primary-hover border border-transparent",
  secondary:
    "bg-surface text-foreground border border-border hover:border-primary hover:text-primary",
  ghost: "bg-transparent text-foreground hover:bg-surface-secondary",
  dark: "bg-ink text-foam hover:bg-copper border border-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-xs",
  md: "px-5 py-3 text-sm",
  lg: "px-6 py-3.5 text-sm",
};

type BaseProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type ButtonAsLink = BaseProps & {
  href: string;
};

function buttonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  className: string,
) {
  return `inline-flex items-center justify-center gap-2 rounded-md font-semibold tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonAsButton | ButtonAsLink) {
  const classes = buttonClassName(variant, size, className);

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
