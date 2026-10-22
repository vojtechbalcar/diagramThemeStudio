/**
 * Auto-map: guess role mappings from token names (design.md §3.3).
 *
 * Each role scores every token of the right type by the words in its path
 * (`color.text.on-primary` → color, text, on, primary). The best score
 * above zero wins; ties go to the token that comes first in the file.
 * Roles the user has confirmed are never touched, and guesses are marked
 * `auto: true` until the user confirms them.
 */

import { ROLES, ROLE_TOKEN_TYPE, type Mapping, type Role, type Token } from "@/lib/model";
import { contrastRatio } from "@/lib/contrast/wcag";

/** Path → lowercase words, splitting on punctuation and camelCase. */
export function pathWords(path: string): string[] {
  return path
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

const PRIMARY = ["primary", "brand", "accent", "main", "action"];
const TEXT = ["text", "fg", "foreground", "content", "label", "copy", "ink", "type"];
const BORDER = ["border", "stroke", "outline"];
const LINE = ["line", "lines", "connector", "connectors", "edge", "edges", "link", "arrow", "divider", "rule"];
const BACKGROUND = ["bg", "background", "surface", "canvas", "page", "paper", "backdrop"];
const NOTE = ["note", "notes", "callout", "highlight", "sticky", "annotation", "caution", "warning"];
const STATES = [
  "hover",
  "active",
  "pressed",
  "disabled",
  "focus",
  "selected",
  "visited",
  "subtle",
  "weak",
  "faded",
  "light",
  "lighter",
  "dark",
  "darker",
  "strong",
  "muted",
  "placeholder",
];

type Words = ReadonlySet<string>;

const has = (words: Words, list: readonly string[]) => list.some((w) => words.has(w));
const NOT = Number.NEGATIVE_INFINITY;

/** The first number in the path that looks like a scale step (50–900). */
function step(words: Words): number | null {
  for (const word of words) {
    const n = Number(word);
    if (/^\d+$/.test(word) && n >= 50 && n <= 1000) return n;
  }
  return null;
}

const statePenalty = (words: Words) => (has(words, STATES) ? -5 : 0);

/** Fills: prefer the middle of a scale (500). */
function fillStep(words: Words): number {
  const n = step(words);
  return n === null ? 0 : Math.max(0, 3 - (Math.abs(n - 500) / 100) * 0.75);
}

/** A colour fill named by `names`, which mustn't be text, a border or "on-" anything. */
function fillScore(words: Words, names: readonly string[]): number {
  if (!has(words, names)) return 0;
  if (has(words, TEXT) || has(words, BORDER) || words.has("on")) return NOT;
  return 10 + (words.has("fill") ? 3 : 0) + (words.has("default") ? 1 : 0) + fillStep(words) + statePenalty(words);
}

type Scorer = (words: Words, token: Token, chosen: Partial<Record<Role, Token>>) => number;

const SCORERS: Readonly<Record<Role, Scorer>> = {
  primaryColor: (words) => fillScore(words, PRIMARY),
  secondaryColor: (words) => fillScore(words, ["secondary"]),
  tertiaryColor: (words) => fillScore(words, ["tertiary", "third"]),

  primaryTextColor: (words, token, chosen) => {
    const fill = chosen.primaryColor;
    if (fill?.id === token.id) return NOT;
    const onPrimary = words.has("on") && has(words, PRIMARY);
    const isText = has(words, TEXT);
    if (!onPrimary && !isText) return 0;
    if (has(words, BORDER) || has(words, BACKGROUND) || has(words, NOTE)) return NOT;
    let score = onPrimary ? 20 : has(words, PRIMARY) ? 12 : 8;
    if (has(words, ["secondary", "tertiary", "link", "placeholder", "disabled", "muted", "subtle"])) score -= 6;
    // Between text tokens, prefer the one that reads on the chosen primary fill.
    if (fill) score += Math.min(contrastRatio(token.value, fill.value), 7);
    return score;
  },

  primaryBorderColor: (words) => {
    if (!has(words, BORDER)) return 0;
    if (has(words, TEXT)) return NOT;
    return 10 + (has(words, PRIMARY) ? 4 : 0) + (words.has("default") ? 1 : 0) + statePenalty(words);
  },

  lineColor: (words) => {
    if (has(words, TEXT) || has(words, BACKGROUND)) return has(words, LINE) ? NOT : 0;
    if (has(words, LINE)) return 10 + statePenalty(words);
    if (words.has("stroke")) return 6 + statePenalty(words);
    if (has(words, BORDER)) return 4 + statePenalty(words);
    return 0;
  },

  background: (words) => {
    if (!has(words, BACKGROUND)) return 0;
    if (has(words, TEXT) || has(words, BORDER) || words.has("on") || has(words, NOTE)) return NOT;
    let score = 10;
    if (has(words, ["default", "base", "primary", "page", "canvas", "body"])) score += 2;
    if (has(words, ["secondary", "tertiary", "raised", "overlay", "elevated", "inverse", "brand", "accent", "sunken"])) {
      score -= 4;
    }
    // Backgrounds: prefer the light end of a scale.
    const n = step(words);
    if (n !== null) score += Math.max(0, 3 - n / 300);
    return score + statePenalty(words);
  },

  noteBkgColor: (words) => {
    if (!has(words, NOTE)) return 0;
    if (has(words, TEXT) || has(words, BORDER) || words.has("on")) return NOT;
    return 10 + (has(words, ["bg", "background", "fill", "surface"]) ? 2 : 0) + statePenalty(words);
  },

  noteTextColor: (words, token, chosen) => {
    if (chosen.noteBkgColor?.id === token.id || !has(words, NOTE)) return 0;
    if (words.has("on")) return 14;
    return has(words, TEXT) ? 12 : 0;
  },

  fontFamily: (words) => {
    let score = 5;
    if (has(words, ["body", "base", "sans", "text", "default", "primary", "ui", "copy"])) score += 3;
    if (has(words, ["mono", "code", "monospace"])) score -= 4;
    if (has(words, ["heading", "display", "headline", "title"])) score -= 2;
    return score;
  },

  fontSize: (words, token) => {
    let score = 5;
    if (has(words, ["base", "body", "md", "default", "medium", "m", "normal", "regular"])) score += 3;
    if (has(words, ["xs", "sm", "lg", "xl", "2xl", "3xl", "heading", "display", "title", "caption", "small", "large"])) {
      score -= 3;
    }
    if (words.has("h1") || words.has("h2") || words.has("h3")) score -= 3;
    const px = /^(\d*\.?\d+)(px|rem)$/.exec(token.value);
    if (px) {
      const size = px[2] === "rem" ? Number(px[1]) * 16 : Number(px[1]);
      if (size >= 12 && size <= 18) score += 2;
    }
    return score;
  },
};

/** Roles whose scorer looks at another role's choice go after it. */
const ORDER: readonly Role[] = [
  "primaryColor",
  "secondaryColor",
  "tertiaryColor",
  "primaryBorderColor",
  "lineColor",
  "background",
  "noteBkgColor",
  "primaryTextColor",
  "noteTextColor",
  "fontFamily",
  "fontSize",
];

/**
 * Fill in guesses for every role the user hasn't confirmed. Confirmed
 * entries (auto: false) whose token still exists are kept as they are.
 */
export function automap(tokens: readonly Token[], current: Mapping = {}): Mapping {
  const byId = new Map(tokens.map((t) => [t.id, t]));
  const words = new Map(tokens.map((t) => [t.id, new Set(pathWords(t.path))]));
  const chosen: Partial<Record<Role, Token>> = {};
  const next: Mapping = {};

  for (const role of ORDER) {
    const kept = current[role];
    const keptToken = kept && !kept.auto ? byId.get(kept.tokenId) : undefined;
    if (kept && keptToken?.type === ROLE_TOKEN_TYPE[role]) {
      next[role] = kept;
      chosen[role] = keptToken;
      continue;
    }

    let best: Token | undefined;
    let bestScore = 0;
    for (const token of tokens) {
      if (token.type !== ROLE_TOKEN_TYPE[role]) continue;
      const score = SCORERS[role](words.get(token.id) ?? new Set(), token, chosen);
      if (score > bestScore) {
        best = token;
        bestScore = score;
      }
    }
    if (best) {
      next[role] = { tokenId: best.id, auto: true };
      chosen[role] = best;
    }
  }

  // Keep the mapping in panel order, so it serialises the same every time.
  const ordered: Mapping = {};
  for (const role of ROLES) {
    const entry = next[role];
    if (entry) ordered[role] = entry;
  }
  return ordered;
}
