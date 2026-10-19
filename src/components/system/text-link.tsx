import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Arrow } from "./arrow";

export type TextLinkProps = ComponentProps<typeof Link> & {
  /** Trailing bare arrow, drawn by the Arrow component, never the → character. */
  arrow?: boolean;
};

/** Inline text link: always underlined, 1px, offset 3px (design.md §1.3.3). */
export function TextLink({ arrow = false, className, children, ...rest }: TextLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-center gap-1 text-ink font-semibold underline decoration-1 underline-offset-3",
        className,
      )}
      {...rest}
    >
      {children}
      {arrow ? <Arrow size={16} /> : null}
    </Link>
  );
}
