import { SymbolFrame, type SymbolProps } from "./symbol-frame";

/** Copy: two offset 12px squares; the back one stops where the front one starts. */
export function SymbolCopy(props: SymbolProps) {
  return (
    <SymbolFrame {...props}>
      <path d="M9 15H5V5H15V9" />
      <rect x="9" y="9" width="10" height="10" />
    </SymbolFrame>
  );
}
