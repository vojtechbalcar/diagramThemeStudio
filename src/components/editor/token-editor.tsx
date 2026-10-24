"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/system/input";
import { SymbolWarning } from "@/components/system/symbol-warning";
import type { Token } from "@/lib/model";
import { editToken } from "@/lib/state/editor";
import { hasExplicitAlpha, normaliseCssColour } from "@/lib/tokens/colour";

export function TokenEditor({ token, onChange }: { token: Token; onChange: (token: Token) => void }) {
  const [value, setValue] = useState(token.value);
  const [path, setPath] = useState(token.path);
  const [alpha, setAlpha] = useState(String((token.alpha ?? 1) * 100));
  const input = useRef<HTMLInputElement>(null);
  const pickerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();
  const opacity = token.type === "color" ? (alpha.trim() ? Number(alpha) / 100 : Number.NaN) : undefined;
  const edited = editToken(token, value, path, opacity);
  const invalid = !edited;
  const commitDraft = () => {
    if (edited && (edited.value !== token.value || edited.path !== token.path || edited.alpha !== token.alpha)) onChange(edited);
  };

  useEffect(() => { input.current?.focus(); }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = editToken(token, value, path, opacity);
      if (next && (next.value !== token.value || next.path !== token.path || next.alpha !== token.alpha)) onChange(next);
    }, 120);
    return () => clearTimeout(timer);
  }, [token, value, path, opacity, onChange]);
  useEffect(() => () => { if (pickerTimer.current) clearTimeout(pickerTimer.current); }, []);

  return <div className="grid gap-3 border-b border-rule bg-recess p-4" onBlur={commitDraft}>
    <label className="grid gap-2 type-small" htmlFor={`${id}-value`}>Value for {token.path}
      <Input data-token-value ref={input} id={`${id}-value`} density="dense" mono value={value} maxLength={300} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined}
        onChange={(event) => {
          const nextValue = event.target.value;
          setValue(nextValue);
          if (token.type === "color") {
            const colour = normaliseCssColour(nextValue);
            if (colour && hasExplicitAlpha(nextValue)) setAlpha(String((colour.alpha ?? 1) * 100));
          }
        }} onBlur={() => { if (edited) setValue(edited.value); }} />
    </label>
    {token.type === "color" ? <div className="flex items-end gap-4">
      <label className="grid gap-2 type-small">Colour picker
        <input type="color" aria-label={`Colour picker for ${token.path}`} value={edited?.value ?? token.value} className="size-6 cursor-pointer border border-ink bg-page p-0"
          onChange={(event) => {
            const nextValue = event.target.value.toUpperCase();
            setValue(nextValue);
            if (pickerTimer.current) clearTimeout(pickerTimer.current);
            pickerTimer.current = setTimeout(() => { const next = editToken(token, nextValue, path, opacity); if (next) onChange(next); }, 50);
          }} />
      </label>
      <label className="grid flex-1 gap-2 type-small">Opacity (%)<Input density="dense" mono type="number" min={0} max={100} step={1} value={alpha} onChange={(event) => setAlpha(event.target.value)} /></label>
    </div> : null}
    <label className="grid gap-2 type-small" htmlFor={`${id}-path`}>Token path<Input id={`${id}-path`} density="dense" mono value={path} maxLength={300} onChange={(event) => setPath(event.target.value)} /></label>
    {invalid ? <p id={`${id}-error`} className="flex gap-2 type-small text-signal"><SymbolWarning className="shrink-0" />{!path.trim() ? "Give this token a path." : token.type === "color" ? "Use a valid colour and opacity from 0 to 100." : token.type === "dimension" ? "Use a positive px or rem size." : "Use a valid font family or font stack."}</p> : null}
  </div>;
}
