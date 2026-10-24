import { SymbolFrame, type SymbolProps } from "./symbol-frame";

/** Parse warning: equilateral triangle (20px side) with a bar and a square dot. */
export function SymbolWarning(props: SymbolProps) {
  return (
    <SymbolFrame {...props}>
      <path d="M12 3.5 22 20.82H2Z" />
      <path d="M12 9V13" />
      <rect x="11" y="15.5" width="2" height="2" className="fill-current" stroke="none" />
    </SymbolFrame>
  );
}
