"use client";

import { Switch } from "radix-ui";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";

export type ToggleProps = ComponentPropsWithoutRef<typeof Switch.Root>;

/**
 * 48×24 switch with a square 16px thumb that travels 24px (design.md §3.9).
 * Behaviour from Radix Switch: role="switch", Space and Enter toggle.
 */
export function Toggle({ className, ...rest }: ToggleProps) {
  return (
    <Switch.Root
      className={cn(
        "relative inline-block h-6 w-12 shrink-0 cursor-pointer border-2 border-ink bg-page",
        "not-disabled:data-[state=checked]:bg-ink",
        "disabled:cursor-not-allowed disabled:border-rule disabled:bg-page",
        className,
      )}
      {...rest}
    >
      <Switch.Thumb
        className={cn(
          "absolute top-[2px] left-[2px] block size-4 bg-ink",
          "data-[state=checked]:translate-x-6 not-data-disabled:data-[state=checked]:bg-on-ink",
          "data-disabled:bg-muted",
        )}
      />
    </Switch.Root>
  );
}
