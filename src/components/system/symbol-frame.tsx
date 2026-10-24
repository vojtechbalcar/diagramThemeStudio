import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/cn";

export type SymbolProps = Omit<SVGProps<SVGSVGElement>, "children" | "width" | "height"> & {
  /** Gives the symbol an accessible name. Without it the symbol is decorative. */
  label?: string;
  /** Drawn on a 24px grid; 48 is for the specimen only. */
  size?: 24 | 48;
};

/** The shared 24px grid, 2px stroke, square caps and mitred joins (design.md §1.8). */
export function SymbolFrame({
  label,
  size = 24,
  className,
  children,
  ...rest
}: SymbolProps & { children: ReactNode }) {
  const a11y = label
    ? ({ role: "img", "aria-label": label } as const)
    : ({ "aria-hidden": true } as const);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      focusable="false"
      className={cn("shrink-0", className)}
      {...a11y}
      {...rest}
    >
      {children}
    </svg>
  );
}
