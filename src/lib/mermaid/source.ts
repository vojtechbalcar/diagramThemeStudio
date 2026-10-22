import type { DiagramKind } from "@/lib/theme/diagrams";

const HEADERS: Record<DiagramKind, RegExp> = { flowchart: /^(?:flowchart|graph)\b/, sequence: /^sequenceDiagram\b/, er: /^erDiagram\b/, gantt: /^gantt\b/ };
const NAMES: Record<DiagramKind, string> = { flowchart: "flowchart", sequence: "sequenceDiagram", er: "erDiagram", gantt: "gantt" };

/** Source edits change structure and labels; tokens remain the theme authority. */
export function validateSource(kind: DiagramKind, source: string): string | null {
  if (source.length > 30_000) return "Keep this diagram under 30,000 characters. Shorten it or reset this diagram.";
  if (/%%\s*\{|^\s*---/m.test(source)) return "Diagram configuration is controlled by your tokens. Remove frontmatter and init directives.";
  if (/(?:^|[;\n])\s*(?:classDef|style|linkStyle|click)\b/i.test(source)) return "Use tokens to style this diagram. Source styles and click interactions are not supported.";
  if (kind === "sequence" && /(?:^|[;\n])\s*(?:rect|box|link|links)\b/i.test(source)) return "Use tokens for sequence colours. Coloured groups and actor link interactions are not supported.";
  const content = source.split("\n").filter((line) => !/^\s*%%/.test(line)).join("\n").trim();
  if (!HEADERS[kind].test(content)) return `Enter a ${NAMES[kind]} diagram, or reset this diagram to its sample.`;
  return null;
}

/** A second embedded copy needs independent IDs for markers and scoped CSS. */
export function scopeSvg(svg: string, scope: string): string {
  const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  let output = svg;
  for (const id of ids) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    output = output.replaceAll(`id="${id}"`, `id="${scope}-${id}"`).replace(new RegExp(`#${escaped}(?![\\w-])`, "g"), `#${scope}-${id}`);
  }
  return output;
}

export type Point = { x: number; y: number };
/** One horizontal segment, followed by a 45-degree segment. */
export function leaderPoints(start: Point, end: Point): Point[] {
  return [start, { x: end.x - Math.abs(end.y - start.y), y: start.y }, end];
}
