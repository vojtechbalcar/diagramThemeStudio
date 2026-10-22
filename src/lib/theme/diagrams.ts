/**
 * The four v1 diagram types. Index numbers are fixed (design.md §1.6):
 * a diagram type keeps its number everywhere.
 */

export const DIAGRAMS = [
  { kind: "flowchart", index: 1, name: "Flowchart" },
  { kind: "sequence", index: 2, name: "Sequence" },
  { kind: "er", index: 3, name: "Entity relationship" },
  { kind: "gantt", index: 4, name: "Gantt" },
] as const;

export type DiagramKind = (typeof DIAGRAMS)[number]["kind"];
