import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type FigureProps = {
  caption: string;
  className?: string;
  children: ReactNode;
};

/** A specimen figure with its caption underneath, set in micro. */
export function Figure({ caption, className, children }: FigureProps) {
  return (
    <figure className={cn("col-span-12 min-w-0", className)}>
      {children}
      <figcaption className="mt-3 type-micro text-muted">{caption}</figcaption>
    </figure>
  );
}
