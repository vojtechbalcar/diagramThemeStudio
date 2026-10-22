/**
 * Contrast checks for the pairs in theme/roles.ts.
 *
 * Colours come from a lookup of Mermaid theme variables, which may be any
 * CSS colour (Mermaid's derived values include names and hsl()). Each is
 * normalised, and translucent colours are composited, the fill over the
 * preview surface and the text over the fill, before the ratio is taken.
 */

import { composite, normaliseCssColour } from "@/lib/tokens/colour";
import type { DiagramKind } from "@/lib/theme/diagrams";
import { CONTRAST_PAIRS, type ContrastPair, type ThemeVariable } from "@/lib/theme/roles";
import { contrastRatio, formatRatio, verdict, type Verdict } from "./wcag";

/** pass = meets the pair's threshold; large = text that only passes at large sizes. */
export type Outcome = "pass" | "large" | "fail";

export type PairCheck = {
  pair: ContrastPair;
  /** The opaque colours the ratio was computed from. */
  foreground: string;
  background: string;
  ratio: number;
  verdict: Verdict;
  outcome: Outcome;
};

export type ColourLookup = (variable: ThemeVariable) => string | undefined;

const TEXT_MINIMUM = 4.5;
const NON_TEXT_MINIMUM = 3;

export function minimumFor(pair: Pick<ContrastPair, "kind">): number {
  return pair.kind === "text" ? TEXT_MINIMUM : NON_TEXT_MINIMUM;
}

export function outcomeOf(pair: Pick<ContrastPair, "kind">, ratio: number): Outcome {
  if (ratio >= minimumFor(pair)) return "pass";
  return pair.kind === "text" && ratio >= NON_TEXT_MINIMUM ? "large" : "fail";
}

/** An opaque hex for `value` over `backdrop`, or null if it isn't a colour. */
function opaque(value: string | undefined, backdrop: string): string | null {
  if (value === undefined) return null;
  const colour = normaliseCssColour(value);
  if (!colour) return null;
  return colour.alpha === undefined ? colour.hex : composite(colour.hex, colour.alpha, backdrop);
}

/** Check one pair; null when either colour is missing or unreadable. */
export function checkPair(pair: ContrastPair, lookup: ColourLookup, surface: string): PairCheck | null {
  const background = pair.background === "surface" ? surface : opaque(lookup(pair.background), surface);
  if (!background) return null;
  const foreground = opaque(lookup(pair.foreground), background);
  if (!foreground) return null;
  const ratio = contrastRatio(foreground, background);
  return { pair, foreground, background, ratio, verdict: verdict(ratio), outcome: outcomeOf(pair, ratio) };
}

/** Every pair that can be checked, in CONTRAST_PAIRS order. */
export function checkPairs(lookup: ColourLookup, surface: string, pairs = CONTRAST_PAIRS): PairCheck[] {
  return pairs.flatMap((pair) => checkPair(pair, lookup, surface) ?? []);
}

export function checksFor(diagram: DiagramKind, checks: readonly PairCheck[]): PairCheck[] {
  return checks.filter((check) => check.pair.diagrams.includes(diagram));
}

export type CheckSummary = {
  pairs: number;
  pass: number;
  large: number;
  fail: number;
  /** The result to show in a card band (design.md §3.4); null when nothing was checked. */
  worst: Outcome | null;
};

export function summarise(checks: readonly PairCheck[]): CheckSummary {
  const count = (outcome: Outcome) => checks.filter((check) => check.outcome === outcome).length;
  const fail = count("fail");
  const large = count("large");
  const pass = count("pass");
  const worst = fail > 0 ? "fail" : large > 0 ? "large" : pass > 0 ? "pass" : null;
  return { pairs: checks.length, pass, large, fail, worst };
}

/**
 * A sign-style line for a pair that falls short (design.md §2.3):
 * "Text on primary fails: 2.9:1. Needs 4.5:1." Null when it passes.
 */
export function contrastMessage(check: PairCheck): string | null {
  const ratio = formatRatio(check.ratio);
  const needs = `Needs ${formatRatio(minimumFor(check.pair))}.`;
  if (check.outcome === "fail") return `${check.pair.short} fails: ${ratio}. ${needs}`;
  if (check.outcome === "large") return `${check.pair.short} passes for large text only: ${ratio}. ${needs}`;
  return null;
}
