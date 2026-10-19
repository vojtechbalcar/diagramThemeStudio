import { SymbolFrame, type SymbolProps } from "./symbol-frame";

/** Swap surface: two opposed arrows, the §1.7 construction at two thirds (2px stroke, 6px arms). */
export function SymbolSwap(props: SymbolProps) {
  return (
    <SymbolFrame {...props}>
      <path d="M5 8H18" />
      <path d="M14.757 3.757 19 8 14.757 12.243" />
      <path d="M19 16H6" />
      <path d="M9.243 11.757 5 16 9.243 20.243" />
    </SymbolFrame>
  );
}
