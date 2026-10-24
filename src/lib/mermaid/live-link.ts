import { mermaidConfig, type ThemeVariables } from "@/lib/theme/build-theme";

/** Mermaid Live still accepts its documented uncompressed base64 state. */
export function liveLink(source: string, variables: ThemeVariables): string {
  const state = JSON.stringify({ code: source, mermaid: JSON.stringify(mermaidConfig(variables)), rough: false, updateDiagram: true });
  const bytes = new TextEncoder().encode(state);
  return `https://mermaid.live/edit#base64:${btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))}`;
}
