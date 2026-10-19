import type { SVGProps } from "react";
import { cn } from "@/lib/cn";

const ROTATION = { e: 0, se: 45, s: 90, sw: 135, w: 180, nw: 225, n: 270, ne: 315 } as const;

export type ArrowDirection = keyof typeof ROTATION;

export type ArrowProps = Omit<SVGProps<SVGSVGElement>, "children" | "width" | "height"> & {
  /** Compass direction; 45° steps only (design.md §1.7). */
  direction?: ArrowDirection;
  /** 24 draws the 3px construction; 16 scales it so the stroke is 2px. */
  size?: 16 | 24 | 48;
  label?: string;
};

/**
 * The one arrow: 24px grid, 3px shaft, 90° head with 9px arms, square caps,
 * mitred join. The shaft's square cap ends inside the head's stroke.
 */
export function Arrow({ direction = "e", size = 24, label, className, ...rest }: ArrowProps) {
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
      strokeWidth={3}
      strokeLinecap="square"
      strokeLinejoin="miter"
      focusable="false"
      className={cn("shrink-0", className)}
      {...a11y}
      {...rest}
    >
      <g transform={ROTATION[direction] ? `rotate(${ROTATION[direction]} 12 12)` : undefined}>
        <path d="M3.5 12H18.5" />
        <path d="M13.636 5.636 20 12 13.636 18.364" />
      </g>
    </svg>
  );
}
