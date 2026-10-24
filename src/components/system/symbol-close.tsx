import { SymbolFrame, type SymbolProps } from "./symbol-frame";

/** Close a dialog or drawer: 12px ✕. */
export function SymbolClose(props: SymbolProps) {
  return (
    <SymbolFrame {...props}>
      <path d="M7 7 17 17M17 7 7 17" />
    </SymbolFrame>
  );
}
