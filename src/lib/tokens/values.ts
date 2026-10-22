/**
 * Normalising font and dimension values, shared by the parsers.
 */

const GENERIC_FAMILIES = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
  "emoji",
  "math",
  "fangsong",
]);

function formatNumber(n: number): string {
  // 16.0 → "16", 0.875 → "0.875"; no exponent notation for sane sizes.
  return String(Math.round(n * 10000) / 10000);
}

/** A px or rem dimension as "16px" / "1.5rem". Anything else (em, %, negative) is null. */
export function normaliseDimension(value: number, unit: string): string | null {
  if (!Number.isFinite(value) || value < 0) return null;
  if (unit !== "px" && unit !== "rem") return null;
  return `${formatNumber(value)}${unit}`;
}

/** "16px", " 1.50rem " → normalised; null for anything that isn't px or rem. */
export function normaliseDimensionString(input: string): string | null {
  const match = /^(\d*\.?\d+)(px|rem)$/.exec(input.trim());
  return match ? normaliseDimension(Number(match[1]), match[2]) : null;
}

/** The size in px, treating 1rem as 16px (the browser default Mermaid assumes). */
export function dimensionToPx(dimension: string): number | null {
  const match = /^(\d*\.?\d+)(px|rem)$/.exec(dimension);
  if (!match) return null;
  const n = Number(match[1]);
  return match[2] === "rem" ? n * 16 : n;
}

function quoteFamily(name: string): string {
  const trimmed = name.trim();
  if (/^(["']).*\1$/.test(trimmed)) return trimmed;
  if (GENERIC_FAMILIES.has(trimmed.toLowerCase())) return trimmed;
  return /^[a-zA-Z_-][\w-]*$/.test(trimmed) ? trimmed : `"${trimmed.replaceAll('"', '\\"')}"`;
}

/**
 * A CSS font-family value. A DTCG array becomes a quoted stack:
 * ["Helvetica Neue", "Arial", "sans-serif"] → "Helvetica Neue", Arial, sans-serif.
 */
export function normaliseFontFamily(input: string | readonly string[]): string | null {
  const value =
    typeof input === "string"
      ? input.trim().replace(/\s+/g, " ")
      : input
          .filter((name) => name.trim() !== "")
          .map(quoteFamily)
          .join(", ");
  return value === "" ? null : value;
}

/** Split on top-level commas (commas inside quotes don't count). */
function splitList(value: string): string[] {
  const items: string[] = [];
  let current = "";
  let quote: string | null = null;
  for (const ch of value) {
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === ",") {
      items.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  items.push(current.trim());
  return items;
}

const FAMILY_ITEM = /^(?:"[^"]+"|'[^']+'|[a-zA-Z_-][\w-]*(?: [a-zA-Z_-][\w-]*)*)$/;

/**
 * Whether a CSS value reads as a font stack. It must be a list of family
 * names, and either end in a generic family or come from a property whose
 * name says it is a font (`--font-sans`, `--font-family-body`).
 */
export function isFontStack(value: string, nameSaysFont: boolean): boolean {
  const items = splitList(value);
  if (items.length === 0 || !items.every((item) => FAMILY_ITEM.test(item))) return false;
  if (items.some((item) => GENERIC_FAMILIES.has(item.toLowerCase()))) return true;
  return nameSaysFont;
}
