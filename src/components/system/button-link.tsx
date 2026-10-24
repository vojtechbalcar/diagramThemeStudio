import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { ArrowTile } from "./arrow-tile";
import { ARROW_TILE_STATES, buttonClass, type ButtonStyleOptions } from "./button-styles";

export type ButtonLinkProps = ComponentProps<typeof Link> & ButtonStyleOptions;

/** A link that looks like a button, for navigation such as "Open the editor". */
export function ButtonLink({ variant = "primary", size, arrow = false, className, children, ...rest }: ButtonLinkProps) {
  const withArrow = arrow && variant === "primary";
  return (
    <Link className={cn(buttonClass({ variant, size, arrow: withArrow }), className)} {...rest}>
      {children}
      {withArrow ? <ArrowTile inverted className={ARROW_TILE_STATES} /> : null}
    </Link>
  );
}
