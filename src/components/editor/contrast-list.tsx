import { VerdictSymbol } from "@/components/system/verdict-symbol";
import { formatRatio } from "@/lib/contrast/wcag";
import { contrastMessage, type PairCheck } from "@/lib/contrast/check";

export function ContrastList({ name, checks }: { name: string; checks: readonly PairCheck[] }) {
  return <section aria-label={`${name} contrast`} className="border-t border-rule bg-page px-4 py-3">
    <ul className="grid gap-2">{checks.map((check) => <li key={check.pair.id} className="flex items-center gap-2" title={contrastMessage(check) ?? (check.verdict === "aaa" ? "Passes AAA." : "Passes AA.")}>
      <VerdictSymbol verdict={check.outcome === "pass" && check.verdict === "large" ? "aa" : check.verdict} className="shrink-0" />
      <span className="w-16 shrink-0 text-right type-mono">{formatRatio(check.ratio)}</span>
      <span className="type-small">{check.pair.name}{check.pair.kind === "non-text" ? <span className="text-muted"> (non-text)</span> : null}</span>
    </li>)}</ul>
    {!checks.length ? <p className="type-small text-muted">Contrast will appear after rendering.</p> : null}
  </section>;
}
