import { SymbolFrame, type SymbolProps } from "./symbol-frame";

/** Remove: 12px bar. */
export function SymbolMinus(props: SymbolProps) {
  return (
    <SymbolFrame {...props}>
      <path d="M7 12H17" />
    </SymbolFrame>
  );
}
