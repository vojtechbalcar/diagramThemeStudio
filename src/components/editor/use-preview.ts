"use client";

import { useEffect, useMemo, useState } from "react";
import type { TokenSet } from "@/lib/model";
import type { DiagramKind } from "@/lib/theme/diagrams";
import { buildThemeVariables, surfaceHex } from "@/lib/theme/build-theme";
import { checkPairs } from "@/lib/contrast/check";
import type { BatchResult } from "@/lib/mermaid/batch";
import { SAMPLES } from "@/lib/mermaid/samples";

export function usePreview(set: TokenSet, sources: Readonly<Record<DiagramKind, string>> = SAMPLES) {
  const surface = surfaceHex(set.surface, set.tokens, set.mapping);
  const variables = useMemo(() => buildThemeVariables(set.tokens, set.mapping, { backdrop: surface }), [set.tokens, set.mapping, surface]);
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([variables, sources, attempt]);
  const [rendered, setRendered] = useState<{ key: string; result: BatchResult | null; error: string | null } | null>(null);
  const enabled = set.tokens.length > 0;
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    async function render() {
      await document.fonts.ready;
      const { renderBatch } = await import("@/lib/mermaid/render");
      if (controller.signal.aborted) return;
      const result = await renderBatch(variables, sources, controller.signal);
      if (result && !controller.signal.aborted) setRendered({ key, result, error: null });
    }
    const timer = setTimeout(() => { void render().catch((error: unknown) => {
      if (!controller.signal.aborted) setRendered({ key, result: null, error: error instanceof Error ? error.message : "The diagram renderer could not load. Try again." });
    }); }, 120);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [enabled, variables, sources, key]);
  const result = enabled ? rendered?.result ?? null : null;
  const pending = enabled && rendered?.key !== key;
  const error = !pending ? rendered?.error ?? null : null;
  const checks = useMemo(() => result && !pending && !error ? checkPairs((variable) => result.variables[variable], surface) : [], [result, surface, pending, error]);
  return { result, checks, surface, pending, error, retry: () => setAttempt((value) => value + 1) };
}
