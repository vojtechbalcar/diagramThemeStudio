/**
 * Supported diagram types. Index numbers are fixed (design.md §1.6):
 * a diagram type keeps its number everywhere.
 */

export const DIAGRAMS = [
  { kind: "flowchart", index: 1, name: "Flowchart" },
  { kind: "sequence", index: 2, name: "Sequence" },
  { kind: "er", index: 3, name: "Entity relationship" },
  { kind: "gantt", index: 4, name: "Gantt" },
  { kind: "state", index: 5, name: "State" },
] as const;

export type DiagramKind = (typeof DIAGRAMS)[number]["kind"];
export const ALL_DIAGRAM_KINDS: readonly DiagramKind[] = DIAGRAMS.map((diagram) => diagram.kind);
/** Keep the landing proof compact; the editor exposes every supported type. */
export const LANDING_DIAGRAMS = DIAGRAMS.slice(0, 4);
export const LANDING_DIAGRAM_KINDS: readonly DiagramKind[] = LANDING_DIAGRAMS.map((diagram) => diagram.kind);
