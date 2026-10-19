import { SymbolFrame, type SymbolProps } from "./symbol-frame";

/** Contrast fail: filled signal circle, white ✕ in both modes. */
export function SymbolFail(props: SymbolProps) {
  return (
    <SymbolFrame {...props}>
      <circle cx="12" cy="12" r="8" className="fill-signal" stroke="none" />
      <path d="M9 9 15 15M15 9 9 15" className="stroke-white" />
    </SymbolFrame>
  );
}
