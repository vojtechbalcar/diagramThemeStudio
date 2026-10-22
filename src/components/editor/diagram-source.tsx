"use client";

import { useId, useRef } from "react";
import { Button } from "@/components/system/button";

export function DiagramSource({ value, onChange, onReset }: { value: string; onChange: (source: string) => void; onReset: () => void }) {
  const id = useId();
  const numbers = useRef<HTMLDivElement>(null);
  return <section className="focus-source" aria-label="Source editor">
    <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-3">
      <label htmlFor={id} className="type-heading">Diagram source</label><Button variant="text" onClick={onReset}>Reset this diagram</Button>
    </div>
    <p id={`${id}-help`} className="px-4 py-4 type-small text-muted">Edit structure and labels. Tokens control the colours. Checks cover theme pairs; custom shapes may use other colours. Source edits stay in this session.</p>
    <div className="source-field">
      <div aria-hidden="true" className="source-lines"><div ref={numbers}>{value.split("\n").map((_, index) => <div key={index}>{index + 1}</div>)}</div></div>
      <textarea id={id} aria-describedby={`${id}-help`} value={value} spellCheck={false} wrap="off" maxLength={30_001} onChange={(event) => onChange(event.target.value)}
        onScroll={(event) => { if (numbers.current) numbers.current.style.transform = `translateY(-${event.currentTarget.scrollTop}px)`; }} />
    </div>
  </section>;
}
