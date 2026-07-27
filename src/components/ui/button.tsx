import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "light"
  | "admin"
  | "admin-secondary"
  | "admin-ghost"
  | "admin-danger";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-copper/70 bg-copper px-5 text-ink hover:bg-beige hover:border-beige",
  secondary:
    "border border-soft-white/30 bg-soft-white/5 px-5 text-soft-white hover:bg-soft-white hover:text-ink",
  ghost:
    "border border-transparent px-3 text-soft-white/72 hover:text-soft-white hover:bg-soft-white/8",
  light:
    "border border-ink/15 bg-ink px-5 text-soft-white hover:bg-charcoal",
  // Admin variants. Scoped to the admin light chrome so nothing leaks into the
  // public dark theme. Accent is reserved for the primary action.
  admin:
    "min-h-10 rounded-lg border border-admin-ink/15 bg-admin-ink px-4 text-admin-surface hover:bg-admin-ink/88 focus-visible:outline-admin-accent",
  "admin-secondary":
    "min-h-10 rounded-lg border border-admin-line-strong bg-admin-surface px-4 text-admin-ink hover:bg-admin-raise focus-visible:outline-admin-accent",
  "admin-ghost":
    "min-h-9 rounded-lg border border-transparent px-3 text-admin-muted hover:bg-admin-raise hover:text-admin-ink focus-visible:outline-admin-accent",
  "admin-danger":
    "min-h-10 rounded-lg border border-admin-danger/25 bg-admin-status-danger-tint px-4 text-admin-danger hover:bg-admin-danger hover:text-admin-surface focus-visible:outline-admin-danger",
};

const baseClasses =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full text-sm font-medium transition duration-300 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button className={cn(baseClasses, variantClasses[variant], className)} {...props} />
  );
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
};

export function ButtonLink({
  className,
  variant = "primary",
  href,
  children,
  ...props
}: ButtonLinkProps) {
  const classes = cn(baseClasses, variantClasses[variant], className);

  if (href.startsWith("http")) {
    return (
      <a className={classes} href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link className={classes} href={href} {...props}>
      {children}
    </Link>
  );
}

