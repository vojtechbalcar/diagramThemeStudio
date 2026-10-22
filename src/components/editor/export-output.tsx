"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/system/button";
import { SymbolCopy } from "@/components/system/symbol-copy";
import { SymbolWarning } from "@/components/system/symbol-warning";

export function ExportOutput({ value, message, error, help, notify }: { value: string; message: string; error?: string; help: string; notify: (message: string) => void }) {
  const [feedback, setFeedback] = useState("");
  const id = useId();
  useEffect(() => { if (!feedback) return; const timer = setTimeout(() => setFeedback(""), 4000); return () => clearTimeout(timer); }, [feedback]);
  return <div className="mt-4">
    <div className="mb-3 flex min-h-6 items-center justify-between gap-4">
      <p id={`${id}-help`} className="type-small text-muted">{help}</p>
      <Button variant="text" disabled={!value || Boolean(error)} onClick={async () => {
        try { await navigator.clipboard.writeText(value); setFeedback(message); notify(message); }
        catch { const failure = "Could not copy. Select the output and copy it manually."; setFeedback(failure); notify(failure); }
      }}><SymbolCopy />Copy</Button>
    </div>
    {error ? <p className="mb-4 flex gap-2 type-small text-signal"><SymbolWarning className="shrink-0" />{error}</p> : null}
    <textarea aria-label="Export output" aria-describedby={`${id}-help`} readOnly spellCheck={false} wrap="off" className="export-code" value={value} />
    <p role="status" className="mt-3 min-h-6 type-small">{feedback || (!value && !error ? "Preparing share link…" : "")}</p>
  </div>;
}
