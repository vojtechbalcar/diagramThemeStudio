import { SymbolFrame, type SymbolProps } from "./symbol-frame";

/** Add: 12px cross. */
export function SymbolPlus(props: SymbolProps) {
  return (
    <SymbolFrame {...props}>
      <path d="M7 12H17M12 7V17" />
    </SymbolFrame>
  );
}
