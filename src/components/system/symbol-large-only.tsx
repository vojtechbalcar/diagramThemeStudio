import { SymbolFrame, type SymbolProps } from "./symbol-frame";

/** Passes for large text and non-text only: ink ring, ink check. */
export function SymbolLargeOnly(props: SymbolProps) {
  return (
    <SymbolFrame {...props}>
      <circle cx="12" cy="12" r="7" className="stroke-ink" />
      <path d="M8 11.5 11 14.5 16 9.5" className="stroke-ink" />
    </SymbolFrame>
  );
}
