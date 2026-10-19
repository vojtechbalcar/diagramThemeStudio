import { cn } from "@/lib/cn";
import { Arrow, type ArrowDirection } from "./arrow";

export type ArrowTileProps = {
  size?: 24 | 48;
  /**
   * On-ink square, ink arrow, framed by a 2px ink rule inside its edge so it
   * reads as the end of its button on any surface. For primary buttons.
   */
  inverted?: boolean;
  direction?: ArrowDirection;
  className?: string;
};

/** The arrow centred in an ink square. Decorative: the control around it carries the name. */
export function ArrowTile({ size = 48, inverted = false, direction, className }: ArrowTileProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        size === 48 ? "size-12" : "size-6",
        inverted ? "bg-on-ink text-ink outline-2 -outline-offset-2 outline-ink" : "bg-ink text-on-ink",
        className,
      )}
    >
      <Arrow direction={direction} size={size === 48 ? 24 : 16} />
    </span>
  );
}
