import type { TokenSet } from "@/lib/model";
import { buildThemeVariables, mermaidConfig, surfaceHex } from "./build-theme";

export const EXPORT_FORMATS = [
  { value: "init", label: "Init directive" },
  { value: "initialize", label: "mermaid.initialize()" },
  { value: "json", label: "JSON" },
  { value: "share", label: "Share link" },
] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number]["value"];

/** Use the same alpha backdrop and label mode as the current preview. */
export function exportConfig(set: TokenSet) {
  const backdrop = surfaceHex(set.surface, set.tokens, set.mapping);
  return mermaidConfig(buildThemeVariables(set.tokens, set.mapping, { backdrop }));
}

function safeJson(value: unknown, indent?: number): string {
  // Keep pasted script blocks and Mermaid directive terminators inside strings.
  return JSON.stringify(value, null, indent).replace(/[<>&%\u2028\u2029]/g, (character) =>
    `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}

export function exportTheme(format: Exclude<ExportFormat, "share">, set: TokenSet): string {
  const config = exportConfig(set);
  if (format === "init") return `%%{init: ${safeJson(config)}}%%`;
  if (format === "initialize") return `mermaid.initialize(${safeJson(config, 2)});`;
  return safeJson(config, 2);
}
