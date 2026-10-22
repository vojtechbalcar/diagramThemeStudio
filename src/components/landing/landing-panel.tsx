import type { CSSProperties } from "react";
import { Band } from "@/components/system/band";
import { Bullet } from "@/components/system/bullet";
import { Button } from "@/components/system/button";
import { VerdictSymbol } from "@/components/system/verdict-symbol";
import { SymbolFail } from "@/components/system/symbol-fail";
import { SymbolWarning } from "@/components/system/symbol-warning";
import { DiagramPicture } from "@/components/editor/diagram-picture";
import type { DIAGRAMS } from "@/lib/theme/diagrams";
import type { DiagramResult } from "@/lib/mermaid/batch";
import { summarise, type PairCheck } from "@/lib/contrast/check";

export function LandingPanel({ diagram, result, checks, pending, error, setName, style, onRetry }: { diagram: (typeof DIAGRAMS)[number]; result?: DiagramResult; checks: readonly PairCheck[]; pending: boolean; error: string | null; setName: string; style: CSSProperties; onRetry: () => void }) {
  const summary = summarise(checks);
  const problem = !pending && (error || result?.ok === false);
  return <article className="diagram-card" aria-label={`${diagram.name} preview panel`}>
    <Band title={diagram.name} bullet={<Bullet kind="index" value={diagram.index} />}>
      {problem ? <SymbolFail label="Render failed" /> : summary.worst ? <span className="flex items-center gap-1 type-micro" aria-label={`${summary.pass} pass, ${summary.large} large text only, ${summary.fail} fail`}><VerdictSymbol verdict={summary.worst === "pass" ? "aa" : summary.worst} />{summary[summary.worst]}</span> : null}
    </Band>
    <div className="diagram-body" style={style} aria-busy={pending}>
      {problem ? <div><SymbolWarning /><p className="mt-3 type-small">Preview unavailable.</p><Button variant="text" className="mt-4" onClick={onRetry}>Retry preview</Button></div>
        : result?.ok ? <DiagramPicture svg={result.svg} label={`${diagram.name} preview, themed with ${setName}`} index={diagram.index} />
          : <div><span className="empty-numeral type-display" aria-hidden="true">{diagram.index}</span><p className="mt-4 type-small">Preparing preview…</p></div>}
      {pending ? <span className="render-progress" aria-hidden="true" /> : null}
    </div>
    <footer className="diagram-footer"><span className="type-micro">Fig. {diagram.index} — {diagram.name}</span></footer>
  </article>;
}
