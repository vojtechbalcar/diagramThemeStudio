import { SymbolFrame, type SymbolProps } from "./symbol-frame";

/** Contrast pass: filled ink circle, on-ink check. */
export function SymbolPass(props: SymbolProps) {
  return (
    <SymbolFrame {...props}>
      <circle cx="12" cy="12" r="8" className="fill-ink" stroke="none" />
      <path d="M8 11.5 11 14.5 16 9.5" className="stroke-on-ink" />
    </SymbolFrame>
  );
}
