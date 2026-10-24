import { VerdictSymbol } from "@/components/system/verdict-symbol";
import { summarise, type PairCheck } from "@/lib/contrast/check";
import { describeTokens } from "@/lib/tokens/summary";
import type { TokenSet } from "@/lib/model";

export function TitleBlock({ set, checks, checking, unavailable }: { set: TokenSet; checks: readonly PairCheck[]; checking: boolean; unavailable: boolean }) {
  const summary = summarise(checks);
  const known = !checking && !unavailable && summary.pairs > 0;
  const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date());
  const contrast = checking ? "Checking contrast…" : !known ? "Unavailable" : `${summary.pass} pass, ${summary.fail} fail${summary.large ? `, ${summary.large} large text only` : ""}`;
  const rows = [
    ["Set", set.name.trim() || "Untitled set"],
    ["Tokens", describeTokens(set.tokens)],
    ["Contrast", contrast],
    ["Mermaid", "base theme, v11+"],
    ["Date", date],
  ];
  return <>
    <table aria-label="Theme details" className="title-block"><tbody>
      {rows.map(([label, value]) => <tr key={label}>
        <th scope="row">{label}</th>
        <td className={label === "Contrast" && known && summary.fail > 0 ? "text-signal" : undefined}>
          <span className="flex items-start gap-2">{label === "Contrast" && known && summary.worst ? <VerdictSymbol verdict={summary.worst === "pass" ? "aa" : summary.worst} className="shrink-0" /> : null}<span>{value}</span></span>
        </td>
      </tr>)}
    </tbody></table>
    {known && summary.fail > 0 ? <p className="mt-4 type-small text-signal">Export is allowed, but {summary.fail} {summary.fail === 1 ? "pair fails" : "pairs fail"} contrast.</p> : null}
    {known && summary.large > 0 ? <p className="mt-3 type-small">{summary.large} {summary.large === 1 ? "pair only passes" : "pairs only pass"} for large text. Normal text needs 4.5:1.</p> : null}
    {unavailable && !checking ? <p className="mt-4 type-small text-muted">Contrast could not be checked. Export is still available.</p> : null}
  </>;
}
