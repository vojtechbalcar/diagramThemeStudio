"use client";

import { Segmented } from "@/components/system/segmented";
import { Toggle } from "@/components/system/toggle";
import { VerdictSymbol } from "@/components/system/verdict-symbol";
import { DIAGRAMS, type DiagramKind } from "@/lib/theme/diagrams";
import { buildThemeVariables } from "@/lib/theme/build-theme";
import { checksFor, summarise, type PairCheck } from "@/lib/contrast/check";
import type { Surface, TokenSet } from "@/lib/model";
import type { BatchResult } from "@/lib/mermaid/batch";
import { DiagramCard } from "./diagram-card";

const SURFACE_OPTIONS = [{ value: "paper", label: "Paper" }, { value: "ink", label: "Ink" }, { value: "brand", label: "Brand" }] as const;

export function Canvas({ set, result, surface, checks, pending, error, showContrast, onShowContrast, onSurface, onReset, notify, sources, onSource }: {
  set: TokenSet; result: BatchResult | null; surface: string; checks: readonly PairCheck[]; pending: boolean; error: string | null; showContrast: boolean;
  onShowContrast: (show: boolean) => void; onSurface: (surface: Surface) => void; sources: Readonly<Record<DiagramKind, string>>; onSource: (kind: DiagramKind, source: string) => void; onReset: (kind: DiagramKind) => void; notify: (message: string) => void;
}) {
  const summary = summarise(checks);
  const variables = buildThemeVariables(set.tokens, set.mapping, { backdrop: surface });
  return <section className="editor-canvas" aria-label="Canvas">
    <div className="canvas-toolbar">
      <div className="flex items-center gap-3"><span className="type-small">Surface</span><Segmented name="preview-surface" legend="Preview surface" options={SURFACE_OPTIONS} value={set.surface} onValueChange={onSurface} className="surface-segments" /></div>
      <div className="flex items-center gap-4">
        {summary.pairs > 0 ? <span className="flex items-center gap-2 type-micro" role="status"><span>{summary.pairs} pairs</span><VerdictSymbol verdict="aa" />{summary.pass}<VerdictSymbol verdict="fail" />{summary.fail}{summary.large ? <><VerdictSymbol verdict="large" />{summary.large}</> : null}</span> : null}
        <label className="flex items-center gap-2 type-small"><Toggle checked={showContrast} onCheckedChange={onShowContrast} aria-label="Show contrast" />Show contrast</label>
      </div>
    </div>
    {!set.tokens.length ? <p className="canvas-empty border-b border-rule bg-page px-6 py-4 type-small"><strong>No tokens yet.</strong> Paste a token file or start from a preset in Tokens.</p> : null}
    <div className="diagram-grid">{DIAGRAMS.map((diagram) => <DiagramCard key={diagram.kind} diagram={diagram} result={result?.diagrams[diagram.kind]} checks={checksFor(diagram.kind, checks)} surface={surface} setName={set.name} variables={variables} showContrast={showContrast} pending={pending} error={error} onReset={() => onReset(diagram.kind)} notify={notify} source={sources[diagram.kind]} onSource={(source) => onSource(diagram.kind, source)} selectedSurface={set.surface} onSurface={onSurface} onShowContrast={onShowContrast} enabled={set.tokens.length > 0} />)}</div>
  </section>;
}
