import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "text" | "destructive";
export type ButtonSize = "m" | "half";

export type ButtonStyleOptions = {
  variant?: ButtonVariant;
  /** `half` is the 24px secondary / destructive button. */
  size?: ButtonSize;
  /** Primary only: an inverted arrow tile flush at the right edge. */
  arrow?: boolean;
};

/**
 * Classes for every button look in design.md §3.9. Hover uses
 * `not-disabled:` so it applies to links too and never to disabled buttons.
 * The disabled primary draws its frame with an inset outline, so the 48px
 * arrow tile keeps its size.
 */
/** The inverted tile follows its button: its frame takes the hover fill, and it greys out when disabled. */
export const ARROW_TILE_STATES =
  "group-not-disabled:group-hover:outline-ink-hover group-disabled:bg-page group-disabled:text-muted group-disabled:outline-rule";

export function buttonClass({ variant = "primary", size = "m", arrow = false }: ButtonStyleOptions = {}) {
  const base =
    "group inline-flex shrink-0 select-none items-center whitespace-nowrap cursor-pointer disabled:cursor-not-allowed";

  switch (variant) {
    case "primary":
      return cn(
        base,
        "h-12 bg-ink pl-4 text-on-ink type-body font-bold",
        arrow ? "gap-4" : "pr-4",
        "not-disabled:hover:bg-ink-hover not-disabled:active:translate-y-px",
        "disabled:bg-page disabled:text-muted disabled:outline-2 disabled:-outline-offset-2 disabled:outline-rule",
      );
    case "secondary":
    case "destructive":
      return cn(
        base,
        "gap-2 border-2 bg-page",
        size === "m" ? "h-12 px-4 type-body font-bold" : "h-6 px-2 type-small font-bold",
        variant === "secondary" ? "border-ink text-ink" : "border-signal text-signal",
        "not-disabled:hover:bg-recess",
        "disabled:border-rule disabled:text-muted",
      );
    case "text":
      return cn(
        base,
        "-mx-1 h-6 gap-2 px-1 text-ink type-body font-semibold decoration-1 underline-offset-3",
        "not-disabled:hover:underline",
        "disabled:text-muted",
      );
  }
}
