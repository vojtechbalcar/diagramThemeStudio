"use client";

import { useEffect, useMemo, useState } from "react";
import type { TokenSet } from "@/lib/model";
import { buildThemeVariables, surfaceHex } from "@/lib/theme/build-theme";
import { checkPairs } from "@/lib/contrast/check";
import type { BatchResult } from "@/lib/mermaid/batch";

export function usePreview(set: TokenSet) {
  const surface = surfaceHex(set.surface, set.tokens, set.mapping);
  const variables = useMemo(() => buildThemeVariables(set.tokens, set.mapping, { backdrop: surface }), [set.tokens, set.mapping, surface]);
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([variables, attempt]);
  const [rendered, setRendered] = useState<{ key: string; result: BatchResult | null; error: string | null } | null>(null);
  const enabled = set.tokens.length > 0;
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    async function render() {
      await document.fonts.ready;
      const { renderBatch } = await import("@/lib/mermaid/render");
      if (controller.signal.aborted) return;
      const result = await renderBatch(variables, undefined, controller.signal);
      if (result && !controller.signal.aborted) setRendered({ key, result, error: null });
    }
    void render().catch((error: unknown) => {
      if (!controller.signal.aborted) setRendered({ key, result: null, error: error instanceof Error ? error.message : "The diagram renderer could not load. Try again." });
    });
    return () => controller.abort();
  }, [enabled, variables, key]);
  const result = enabled ? rendered?.result ?? null : null;
  const checks = useMemo(() => result ? checkPairs((variable) => result.variables[variable], surface) : [], [result, surface]);
  return { result, checks, surface, pending: enabled && rendered?.key !== key, error: rendered?.error ?? null, retry: () => setAttempt((value) => value + 1) };
}
