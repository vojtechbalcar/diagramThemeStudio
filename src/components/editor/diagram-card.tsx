"use client";

import { Band } from "@/components/system/band";
import { ArrowTile } from "@/components/system/arrow-tile";
import { Bullet } from "@/components/system/bullet";
import { Button } from "@/components/system/button";
import { SymbolWarning } from "@/components/system/symbol-warning";
import { SymbolFail } from "@/components/system/symbol-fail";
import { VerdictSymbol } from "@/components/system/verdict-symbol";
import { summarise, type PairCheck } from "@/lib/contrast/check";
import { higherContrast } from "@/lib/contrast/wcag";
import { INK, PAPER, type ThemeVariables } from "@/lib/theme/build-theme";
import type { DIAGRAMS } from "@/lib/theme/diagrams";
import type { DiagramResult } from "@/lib/mermaid/batch";
import type { Surface } from "@/lib/model";
import { DiagramPicture } from "./diagram-picture";
import { FocusMode } from "./focus-mode";
import { liveLink } from "@/lib/mermaid/live-link";
import type { CSSProperties } from "react";
import { ContrastList } from "./contrast-list";

export function DiagramCard({ diagram, result, checks, surface, setName, variables, showContrast, pending, error, onReset, notify, source, onSource, selectedSurface, onSurface, onShowContrast, enabled }: {
  diagram: (typeof DIAGRAMS)[number]; result?: DiagramResult; checks: readonly PairCheck[]; surface: string; setName: string; variables: ThemeVariables;
  source: string; onSource: (source: string) => void; selectedSurface: Surface; onSurface: (surface: Surface) => void; onShowContrast: (show: boolean) => void; enabled: boolean;
  showContrast: boolean; pending: boolean; error: string | null; onReset: () => void; notify: (message: string) => void;
}) {
  const summary = summarise(checks);
  const problem = !pending && result?.ok === false ? result.error : error;
  const ink = higherContrast(surface, INK, PAPER);
  const style = { backgroundColor: surface, "--lw-ink": ink, "--lw-on-ink": ink === INK ? PAPER : INK, "--lw-focus": ink, color: ink } as CSSProperties;
  return <article className="diagram-card" data-diagram={diagram.kind} aria-label={`${diagram.name} diagram`}>
    <Band titleAs="h2" title={diagram.name} bullet={<Bullet kind="index" value={diagram.index} />}>
      {problem ? <SymbolFail label="Render failed" /> : summary.worst ? <span className="flex items-center gap-1 type-micro" aria-label={`${summary.pairs} pairs: ${summary.pass} pass, ${summary.large} large text only, ${summary.fail} fail`}><VerdictSymbol verdict={summary.worst === "pass" ? "aa" : summary.worst} />{summary[summary.worst]}</span> : null}
    </Band>
    <div className="diagram-body" style={style} aria-busy={pending}>
      {problem ? <div className="pointer-events-none relative z-10 max-w-full"><SymbolWarning /><p className="mt-3 break-words type-mono-small">{problem}</p><Button variant="text" className="pointer-events-auto mt-4" onClick={onReset}>Reset this diagram</Button></div>
        : result?.ok ? <DiagramPicture svg={result.svg} index={diagram.index} label={`${diagram.name} preview, themed with ${setName || "Untitled set"}`} />
        : <div><span className="empty-numeral type-display" aria-hidden="true">{diagram.index}</span><p className="mt-4 type-small">{pending ? "Rendering your theme…" : "Add tokens to preview your theme."}</p></div>}
    <FocusMode diagram={diagram} result={result} checks={checks} source={source} onSource={onSource} onReset={onReset} surface={selectedSurface} onSurface={onSurface} style={style} setName={setName} pending={pending} error={error} showContrast={showContrast} onShowContrast={onShowContrast} variables={variables} notify={notify} enabled={enabled} />
      {pending ? <span className="render-progress" role="status"><span className="sr-only">Rendering {diagram.name}</span></span> : null}
    </div>
    {showContrast && result?.ok && !problem ? <ContrastList name={diagram.name} checks={checks} /> : null}

    <footer className="diagram-footer">
      <span className="type-micro">Fig. {diagram.index} — {diagram.name}</span>
      <div className="flex items-center gap-3">
        <Button variant="text" disabled={!result?.ok || pending} onClick={async () => {
          if (!result?.ok) return;
          try { await navigator.clipboard.writeText(result.svg); notify(`Copied ${diagram.name.toLowerCase()} SVG.`); }
          catch { notify("SVG could not be copied. Check clipboard permissions and try again."); }
        }}>Copy SVG</Button>
        {result?.ok && !pending && !problem ? <a className="inline-flex min-h-6 items-center gap-2 type-micro hover:underline" href={liveLink(source, variables)} target="_blank" rel="noopener noreferrer">Open in Mermaid Live<span className="sr-only"> (new tab)</span><ArrowTile size={24} /></a> : null}
      </div>
    </footer>
  </article>;
}
