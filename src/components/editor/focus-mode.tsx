"use client";

import { Dialog } from "radix-ui";
import { useId, useMemo, useState, type CSSProperties } from "react";
import { Band } from "@/components/system/band";
import { Bullet } from "@/components/system/bullet";
import { Button } from "@/components/system/button";
import { IconButton } from "@/components/system/icon-button";
import { SymbolClose } from "@/components/system/symbol-close";
import { SymbolWarning } from "@/components/system/symbol-warning";
import { Segmented } from "@/components/system/segmented";
import { Toggle } from "@/components/system/toggle";
import type { DiagramResult } from "@/lib/mermaid/batch";
import { scopeSvg } from "@/lib/mermaid/source";
import type { DIAGRAMS } from "@/lib/theme/diagrams";
import type { PairCheck } from "@/lib/contrast/check";
import type { Surface } from "@/lib/model";
import type { ThemeVariables } from "@/lib/theme/build-theme";
import { liveLink } from "@/lib/mermaid/live-link";
import { ContrastAnnotations } from "./contrast-annotations";
import { ContrastList } from "./contrast-list";
import { DiagramSource } from "./diagram-source";

export function FocusMode({ diagram, result, checks, source, onSource, onReset, surface, onSurface, style, setName, pending, error, showContrast, onShowContrast, variables, notify, enabled }: {
  diagram: (typeof DIAGRAMS)[number]; result?: DiagramResult; checks: readonly PairCheck[]; source: string; onSource: (source: string) => void; onReset: () => void;
  surface: Surface; onSurface: (surface: Surface) => void; style: CSSProperties; setName: string; pending: boolean; error: string | null; showContrast: boolean; onShowContrast: (show: boolean) => void; variables: ThemeVariables; notify: (message: string) => void; enabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const id = useId().replaceAll(":", "");
  const svg = useMemo(() => result?.ok ? scopeSvg(result.svg, `focus-${id}`) : "", [result, id]);
  const problem = !pending && result?.ok === false ? result.error : error;
  return <Dialog.Root open={open} onOpenChange={(next) => { setOpen(next); setFeedback(""); }}>
    <Dialog.Trigger asChild><button type="button" className="diagram-open" aria-label={`Open ${diagram.name} focus mode`} disabled={!enabled}><span className="diagram-open-label" aria-hidden="true">Edit diagram</span></button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="editor-scrim" />
      <Dialog.Content className="diagram-focus">
        <Band titleAs="div" bullet={<Bullet kind="index" value={diagram.index} />} title={<Dialog.Title>{diagram.name}<span className="sr-only"> focus mode</span></Dialog.Title>}>
          <Dialog.Close asChild><IconButton label="Close focus mode"><SymbolClose /></IconButton></Dialog.Close>
        </Band>
        <Dialog.Description className="sr-only">Edit diagram source and inspect theme contrast. Escape returns to the canvas.</Dialog.Description>
        <div className="focus-workspace">
          <div className="focus-preview">
            <div className="canvas-toolbar">
              <Segmented name={`${id}-surface`} legend="Preview surface" options={[{ value: "paper", label: "Paper" }, { value: "ink", label: "Ink" }, { value: "brand", label: "Brand" }]} value={surface} onValueChange={onSurface} className="surface-segments" />
              <label className="flex items-center gap-2 type-small"><Toggle aria-label="Show contrast" checked={showContrast} onCheckedChange={onShowContrast} />Show contrast</label>
            </div>
            <div className="focus-scroll" aria-busy={pending}>
              {problem ? <div role="alert" className="p-6"><SymbolWarning /><p className="mt-3 break-words type-mono-small">{problem}</p><p className="mt-4 type-small">Check the source or reset this diagram.</p></div>
                : svg ? <ContrastAnnotations kind={diagram.kind} svg={svg} checks={showContrast && !pending ? checks : []} setName={setName} style={style} />
                  : <p className="p-6 type-small">Rendering your theme…</p>}
            </div>
            {pending ? <div role="status" className="focus-progress"><span className="sr-only">Rendering {diagram.name}</span></div> : null}
            {showContrast && result?.ok && !pending && !problem ? <ContrastList name={`${diagram.name} focus`} checks={checks} /> : null}
            <div className="focus-actions">
              <Button variant="text" disabled={!result?.ok || pending || Boolean(problem)} onClick={async () => {
                if (!result?.ok) return;
                try { await navigator.clipboard.writeText(result.svg); setFeedback("Copied SVG."); notify(`Copied ${diagram.name.toLowerCase()} SVG.`); }
                catch { setFeedback("SVG could not be copied. Check clipboard permissions and try again."); }
              }}>Copy SVG</Button>
              {result?.ok && !pending && !problem ? <a className="type-small underline underline-offset-3" href={liveLink(source, variables)} target="_blank" rel="noopener noreferrer">Open in Mermaid Live<span className="sr-only"> (new tab)</span></a> : null}
              <p role="status" className="type-small">{feedback}</p>
            </div>
          </div>
          <DiagramSource value={source} onChange={onSource} onReset={onReset} />
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
