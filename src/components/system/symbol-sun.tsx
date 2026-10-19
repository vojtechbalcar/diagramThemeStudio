import { SymbolFrame, type SymbolProps } from "./symbol-frame";

const TICKS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i * Math.PI) / 4;
  const point = (r: number) =>
    `${(12 + r * Math.cos(angle)).toFixed(3)} ${(12 + r * Math.sin(angle)).toFixed(3)}`;
  return `M${point(8)}L${point(9.5)}`;
}).join("");

/** Light mode: a circle with 8 ticks. */
export function SymbolSun(props: SymbolProps) {
  return (
    <SymbolFrame {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d={TICKS} />
    </SymbolFrame>
  );
}
