"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Button } from "@/components/system/button";
import { Segmented } from "@/components/system/segmented";
import { SymbolWarning } from "@/components/system/symbol-warning";
import { IMPORT_FORMATS, importTokens, type ImportFormat } from "@/lib/tokens/import";
import { describeTokens } from "@/lib/tokens/summary";
import type { Token } from "@/lib/model";
import { EditorDialog } from "./editor-dialog";

export function ImportDialog({ onImport }: { onImport: (tokens: Token[]) => void }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ImportFormat>("dtcg");
  const [text, setText] = useState("");
  const id = useId();
  const lineNumbers = useRef<HTMLDivElement>(null);
  const result = useMemo(() => text.trim() ? importTokens(format, text) : null, [format, text]);
  const lines = text.split("\n").length;

  return (
    <EditorDialog title="Import tokens" description="Paste a token file, CSS variables or a Figma variables export. Importing replaces the current set." open={open} onOpenChange={setOpen}
      trigger={<Button variant="text">Import</Button>}>
      <div className="p-6">
        <Segmented name={`${id}-format`} legend="Import format" options={IMPORT_FORMATS} value={format} onValueChange={setFormat} className="import-formats w-full" />
        <label htmlFor={`${id}-source`} className="mt-6 block type-heading">Token source</label>
        <p id={`${id}-help`} className="mt-2 type-small text-muted">Paste your tokens below. Using them replaces the current set.</p>
        <div className="source-field mt-4">
          <div aria-hidden="true" className="source-lines"><div ref={lineNumbers}>{Array.from({ length: lines }, (_, index) => <div key={index}>{index + 1}</div>)}</div></div>
          <textarea autoFocus id={`${id}-source`} aria-describedby={`${id}-help ${id}-result`} spellCheck={false} value={text} onChange={(event) => setText(event.target.value)} aria-invalid={result?.ok === false}
            onScroll={(event) => { if (lineNumbers.current) lineNumbers.current.style.transform = `translateY(-${event.currentTarget.scrollTop}px)`; }} />
        </div>
        <div id={`${id}-result`} role="status" className="mt-4 type-small">
          {!result ? <p className="text-muted">Colours, fonts and font sizes are supported.</p> : result.ok ? <>
            <p className="type-micro">{describeTokens(result.tokens)} found{result.skipped ? `; ${result.skipped} skipped` : ""}.</p>
            {result.warnings.length ? <ul className="mt-3 space-y-2">{result.warnings.map((warning, index) => <li key={index} className="flex gap-2"><SymbolWarning className="shrink-0" /><span><span className="type-mono-small break-all">{warning.path}</span> {warning.message}</span></li>)}</ul> : null}
          </> : <p className="flex gap-2 text-signal"><SymbolWarning className="shrink-0" />{result.error.message}</p>}
        </div>
        <div className="mt-6 flex justify-end"><Button disabled={!result?.ok || result.tokens.length === 0} onClick={() => {
          if (result?.ok && result.tokens.length) { onImport(result.tokens); setOpen(false); }
        }} arrow>Use tokens</Button></div>
      </div>
    </EditorDialog>
  );
}
