import { SymbolFrame, type SymbolProps } from "./symbol-frame";

/**
 * Dark mode: a crescent from two circles — r 7 at (12, 12) cut by r 6 at
 * (16.5, 8). The path runs between their two intersections.
 */
export function SymbolMoon(props: SymbolProps) {
  return (
    <SymbolFrame {...props}>
      <path d="M11.282 5.037A7 7 0 1 0 18.832 13.528A6 6 0 0 1 11.282 5.037Z" />
    </SymbolFrame>
  );
}
