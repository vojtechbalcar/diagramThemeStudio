import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BandProps = {
  title: ReactNode;
  titleAs?: "h1" | "h2" | "h3" | "p" | "div";
  /** Optional bullet before the title (design.md §1.4). */
  bullet?: ReactNode;
  /** Status and actions, right-aligned. */
  children?: ReactNode;
  as?: "header" | "div";
  id?: string;
  className?: string;
};

/** The black band at the top of every unit, with its pinstripe. An ink scope. */
export function Band({
  title,
  titleAs: Title = "h2",
  bullet,
  children,
  as: Root = "div",
  id,
  className,
}: BandProps) {
  return (
    <Root className={cn("lw-band", className)}>
      {bullet}
      <Title id={id} className="min-w-0">
        {title}
      </Title>
      {children ? <div className="ml-auto flex items-center gap-2">{children}</div> : null}
    </Root>
  );
}
