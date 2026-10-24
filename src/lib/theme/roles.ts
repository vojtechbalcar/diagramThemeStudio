/**
 * Mermaid theme roles as the mapping panel shows them (design.md §3.3),
 * and the text/fill pairs whose contrast Linework checks.
 *
 * Pairs name Mermaid's own theme variables, not our roles, because that is
 * what the diagrams are drawn with: a node's text is `nodeTextColor` on
 * `mainBkg`, which Mermaid derives from primaryTextColor and primaryColor
 * unless they are set. Checking the resolved variables (read back from
 * Mermaid after initialize, M3) covers derived colours too.
 */

import { ROLES, ROLE_TOKEN_TYPE, type Mapping, type Role, type TokenType } from "@/lib/model";
import type { DiagramKind } from "./diagrams";

/** The letter in a token bullet: the first letter of the token's role (design.md §1.6). */
export type TokenGlyph = "P" | "S" | "T" | "L" | "B" | "N";

export type RoleDefinition = {
  role: Role;
  label: string;
  tokenType: TokenType;
  /** Font roles have no bullet glyph; only colour tokens get bullets. */
  glyph: TokenGlyph | null;
};

const LABELS: Readonly<Record<Role, readonly [label: string, glyph: TokenGlyph | null]>> = {
  primaryColor: ["Primary fill", "P"],
  primaryTextColor: ["Primary text", "P"],
  primaryBorderColor: ["Primary border", "P"],
  secondaryColor: ["Secondary fill", "S"],
  tertiaryColor: ["Tertiary fill", "T"],
  lineColor: ["Line", "L"],
  background: ["Background", "B"],
  noteBkgColor: ["Note fill", "N"],
  noteTextColor: ["Note text", "N"],
  fontFamily: ["Font family", null],
  fontSize: ["Font size", null],
};

/** Every role, in mapping-panel order. */
export const ROLE_DEFINITIONS: readonly RoleDefinition[] = ROLES.map((role) => ({
  role,
  label: LABELS[role][0],
  tokenType: ROLE_TOKEN_TYPE[role],
  glyph: LABELS[role][1],
}));

export function roleLabel(role: Role): string {
  return LABELS[role][0];
}

/** The glyph for a token's bullet: from the first role (in panel order) it is mapped to. */
export function glyphFor(tokenId: string, mapping: Mapping): TokenGlyph | null {
  for (const role of ROLES) {
    const glyph = LABELS[role][1];
    if (glyph && mapping[role]?.tokenId === tokenId) return glyph;
  }
  return null;
}

/** Mermaid theme variables the contrast pairs read. */
export type ThemeVariable =
  | "mainBkg"
  | "nodeTextColor"
  | "nodeBorder"
  | "actorLineColor"
  | "noteBkgColor"
  | "noteTextColor"
  | "textColor"
  | "lineColor"
  | "edgeLabelBackground"
  | "clusterBkg"
  | "titleColor"
  | "rowOdd"
  | "rowEven"
  | "sectionBkgColor"
  | "stateLabelColor" | "stateBkg" | "transitionLabelColor" | "labelBackgroundColor" | "transitionColor";

export type ContrastPair = {
  id: string;
  /** Annotation text (design.md §3.5): "Primary text on primary fill". */
  name: string;
  /** Subject of a message (§2.3): "Text on primary fails: 2.9:1." */
  short: string;
  /** Text needs 4.5:1; lines and outlines (non-text) need 3:1. */
  kind: "text" | "non-text";
  foreground: ThemeVariable;
  /** "surface" is the preview surface the diagram sits on (§1.2.3). */
  background: ThemeVariable | "surface";
  /** Mermaid draws the Gantt section fill at 20% opacity over the surface. */
  backgroundOpacity?: number;
  /** The roles that decide this pair, for the mapping panel's contrast symbols. */
  roles: readonly Role[];
  /** Where the pair appears, for each card's contrast list and summary. */
  diagrams: readonly DiagramKind[];
};

export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { id: "state-text", name: "State text on state fill", short: "State text", kind: "text", foreground: "stateLabelColor", background: "stateBkg", roles: ["primaryTextColor", "primaryColor"], diagrams: ["state"] },
  { id: "state-transition", name: "Transition text on label fill", short: "Transition text", kind: "text", foreground: "transitionLabelColor", background: "labelBackgroundColor", backgroundOpacity: 0.5, roles: ["primaryTextColor", "primaryColor", "background"], diagrams: ["state"] },
  { id: "state-line", name: "Transition line on background", short: "Transition line", kind: "non-text", foreground: "transitionColor", background: "surface", roles: ["lineColor", "background"], diagrams: ["state"] },
  {
    id: "primary-text",
    name: "Primary text on primary fill",
    short: "Text on primary",
    kind: "text",
    foreground: "nodeTextColor",
    background: "mainBkg",
    roles: ["primaryTextColor", "primaryColor"],
    // Nodes, actors, entities and task bars all draw primary text on primary fill.
    diagrams: ["flowchart", "sequence", "er", "gantt"],
  },
  {
    id: "label-text",
    name: "Label text on secondary fill",
    short: "Label text",
    kind: "text",
    foreground: "textColor",
    background: "edgeLabelBackground",
    roles: ["primaryTextColor", "secondaryColor"],
    diagrams: ["flowchart", "er"],
  },
  {
    id: "title-text",
    name: "Group title on tertiary fill",
    short: "Group title",
    kind: "text",
    foreground: "titleColor",
    background: "clusterBkg",
    roles: ["tertiaryColor"],
    diagrams: ["flowchart"],
  },
  {
    id: "note-text",
    name: "Note text on note fill",
    short: "Note text",
    kind: "text",
    foreground: "noteTextColor",
    background: "noteBkgColor",
    roles: ["noteTextColor", "noteBkgColor"],
    diagrams: ["sequence", "state"],
  },
  {
    id: "text-on-background",
    name: "Text on background",
    short: "Text on background",
    kind: "text",
    foreground: "textColor",
    background: "surface",
    roles: ["primaryTextColor", "background"],
    // Message labels in sequence diagrams, task text outside its bar in Gantt.
    diagrams: ["sequence", "gantt"],
  },
  {
    id: "line-on-background",
    name: "Line on background",
    short: "Line on background",
    kind: "non-text",
    foreground: "lineColor",
    background: "surface",
    roles: ["lineColor", "background"],
    diagrams: ["flowchart", "er"],
  },
  {
    id: "lifeline-on-background",
    name: "Lifeline on background",
    short: "Lifeline on background",
    kind: "non-text",
    foreground: "actorLineColor",
    background: "surface",
    roles: ["primaryBorderColor", "background"],
    diagrams: ["sequence"],
  },
  {
    id: "attribute-odd",
    name: "Attribute text on odd rows",
    short: "Odd-row attribute text",
    kind: "text",
    foreground: "nodeTextColor",
    background: "rowOdd",
    roles: ["primaryTextColor", "primaryColor"],
    diagrams: ["er"],
  },
  {
    id: "attribute-even",
    name: "Attribute text on even rows",
    short: "Even-row attribute text",
    kind: "text",
    foreground: "nodeTextColor",
    background: "rowEven",
    roles: ["primaryTextColor", "primaryColor"],
    diagrams: ["er"],
  },
  {
    id: "section-text",
    name: "Task text on section fill",
    short: "Text on section",
    kind: "text",
    foreground: "textColor",
    background: "sectionBkgColor",
    backgroundOpacity: 0.2,
    roles: ["primaryTextColor", "secondaryColor", "background"],
    diagrams: ["gantt"],
  },
  {
    id: "section-title",
    name: "Section title on section fill",
    short: "Section title",
    kind: "text",
    foreground: "titleColor",
    background: "sectionBkgColor",
    backgroundOpacity: 0.2,
    roles: ["tertiaryColor", "secondaryColor", "background"],
    diagrams: ["gantt"],
  },
];

export function pairsFor(diagram: DiagramKind): readonly ContrastPair[] {
  return CONTRAST_PAIRS.filter((pair) => pair.diagrams.includes(diagram));
}

export function pairsForRole(role: Role): readonly ContrastPair[] {
  return CONTRAST_PAIRS.filter((pair) => pair.roles.includes(role));
}
