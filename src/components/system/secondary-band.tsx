import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type SecondaryBandProps = {
  title: ReactNode;
  titleAs?: "h2" | "h3" | "h4" | "p";
  children?: ReactNode;
  id?: string;
  className?: string;
};

/** 32px sub-section band inside a panel. No pinstripe. An ink scope. */
export function SecondaryBand({ title, titleAs: Title = "h3", children, id, className }: SecondaryBandProps) {
  return (
    <div className={cn("lw-band-2", className)}>
      <Title id={id} className="min-w-0">
        {title}
      </Title>
      {children ? <div className="ml-auto flex items-center gap-2">{children}</div> : null}
    </div>
  );
}
