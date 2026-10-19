import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  /** Required: the button has no visible text. */
  label: string;
};

/** 24px symbol button; inverts on hover and press (design.md §3.9). */
export function IconButton({ label, type = "button", className, children, ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "inline-flex size-6 shrink-0 cursor-pointer items-center justify-center text-ink",
        "not-disabled:hover:bg-ink not-disabled:hover:text-on-ink",
        "not-disabled:active:bg-ink not-disabled:active:text-on-ink",
        "disabled:cursor-not-allowed disabled:text-muted",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
