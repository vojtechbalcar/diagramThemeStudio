import type { Verdict } from "@/lib/contrast/wcag";
import { SymbolFail } from "./symbol-fail";
import { SymbolLargeOnly } from "./symbol-large-only";
import { SymbolPass } from "./symbol-pass";

const LABEL: Record<Verdict, string> = {
  aaa: "Passes AAA",
  aa: "Passes AA",
  large: "Large text only",
  fail: "Fails",
};

export type VerdictSymbolProps = {
  verdict: Verdict;
  className?: string;
};

/** The symbol for a contrast verdict, named for assistive technology. Always shown with the ratio. */
export function VerdictSymbol({ verdict, className }: VerdictSymbolProps) {
  const label = LABEL[verdict];
  return <span key={verdict} className={`verdict-mark ${className ?? ""}`}>
    {verdict === "fail" ? <SymbolFail label={label} /> : verdict === "large" ? <SymbolLargeOnly label={label} /> : <SymbolPass label={label} />}
  </span>;
}
