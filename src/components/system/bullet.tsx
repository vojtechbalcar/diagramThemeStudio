import { cn } from "@/lib/cn";
import { tokenBulletLook } from "@/lib/contrast/token-bullet";
import type { TokenGlyph } from "@/lib/theme/roles";

export type BulletSize = "large" | "standard" | "small";

const SIZE: Record<BulletSize, string> = {
  large: "size-8 type-heading",
  standard: "size-6 type-small font-bold",
  small: "size-4 type-micro font-bold",
};

type IndexBullet = { kind: "index"; value: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 };
type StepBullet = { kind: "step"; value: 1 | 2 | 3 };
type TokenBullet = { kind: "token"; glyph: TokenGlyph; color: string; label: string };

export type BulletProps = (IndexBullet | StepBullet | TokenBullet) & {
  size?: BulletSize;
  /** Accessible name. Index and step bullets are decorative without one. */
  label?: string;
  className?: string;
};

/**
 * Three uses only (design.md §1.6): diagram index (ink, numeral), token
 * (the token's colour, role letter) and step (ink ring, numeral).
 */
export function Bullet(props: BulletProps) {
  const base = cn(
    "inline-flex shrink-0 select-none items-center justify-center rounded-full tabular-nums",
    SIZE[props.size ?? "standard"],
    props.className,
  );
  const a11y = props.label
    ? ({ role: "img", "aria-label": props.label } as const)
    : ({ "aria-hidden": true } as const);

  if (props.kind === "token") {
    const look = tokenBulletLook(props.color);
    return (
      <span
        className={cn(
          base,
          look.glyph === "dark" ? "text-black" : "text-white",
          look.ring && "border",
          look.ring === "near-white" && "border-[var(--lw-ring-near-white)]",
          look.ring === "near-black" && "border-[var(--lw-ring-near-black)]",
        )}
        style={{ backgroundColor: props.color }}
        {...a11y}
      >
        {props.glyph}
      </span>
    );
  }

  return (
    <span
      className={cn(base, props.kind === "index" ? "bg-ink text-on-ink" : "border-2 border-ink text-ink")}
      {...a11y}
    >
      {props.value}
    </span>
  );
}
