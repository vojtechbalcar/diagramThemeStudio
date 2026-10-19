import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** 48px by default; 32px in dense tables. No other heights. */
  density?: "m" | "dense";
  /** Machine values (hex, paths) are set in mono. */
  mono?: boolean;
};

/** Recessed field with a bottom rule; focus thickens the rule to 2px ink. */
export function Input({ density = "m", mono = false, type = "text", className, ...rest }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "block w-full min-w-0 border-b border-rule bg-recess px-3 text-ink placeholder:text-muted",
        density === "m" ? "h-12" : "h-8",
        mono ? "type-mono" : "type-body",
        "focus-visible:border-b-2 focus-visible:border-ink",
        "aria-invalid:border-signal aria-invalid:text-signal",
        "disabled:cursor-not-allowed disabled:border disabled:border-rule disabled:bg-page disabled:text-muted",
        className,
      )}
      {...rest}
    />
  );
}
