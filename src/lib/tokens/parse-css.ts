/**
 * CSS custom properties → Token[].
 *
 * Takes a whole stylesheet or a few pasted lines. Every `--name: value`
 * is read wherever it sits (`:root`, `@theme`, `@media`…); other CSS is
 * skipped. `var()` references are resolved, `light-dark(a, b)` takes the
 * light value, and when a property is declared twice the first value
 * wins, which is the light theme in most files.
 */

import type { TokenType } from "@/lib/model";
import { normaliseCssColour } from "./colour";
import { looksLikeFontSize } from "./parse-dtcg";
import { failed, parsed, type ParseResult, type ParseWarning, type TokenDraft } from "./result";
import { isFontStack, normaliseDimensionString, normaliseFontFamily } from "./values";

type Declaration = { name: string; value: string };

const PROPERTY = /--[A-Za-z0-9_-]+(?=\s*:)/y;

/** Replace comments with spaces, keeping newlines so line numbers still hold. */
function stripComments(css: string): string | { line: number } {
  let out = "";
  let i = 0;
  while (i < css.length) {
    const ch = css[i];
    if (ch === '"' || ch === "'") {
      const end = endOfString(css, i);
      out += css.slice(i, end);
      i = end;
    } else if (ch === "/" && css[i + 1] === "*") {
      const close = css.indexOf("*/", i + 2);
      if (close === -1) return { line: css.slice(0, i).split("\n").length };
      out += css.slice(i, close + 2).replace(/[^\n]/g, " ");
      i = close + 2;
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

/** Index just past the string that starts at `start` (or the end of the line if unclosed). */
function endOfString(css: string, start: number): number {
  const quote = css[start];
  let i = start + 1;
  while (i < css.length && css[i] !== quote && css[i] !== "\n") i += css[i] === "\\" ? 2 : 1;
  return Math.min(i + 1, css.length);
}

/** The custom property name if a `--name:` declaration starts at `i`. */
function propertyAt(css: string, i: number): string | null {
  PROPERTY.lastIndex = i;
  return PROPERTY.exec(css)?.[0] ?? null;
}

/**
 * Read a value up to `;` or `}` at depth 0. A newline followed by another
 * custom property also ends it, so pasted lines without semicolons work.
 */
function readValue(css: string, start: number): { value: string; end: number } {
  let depth = 0;
  let i = start;
  while (i < css.length) {
    const ch = css[i];
    if (ch === '"' || ch === "'") {
      i = endOfString(css, i);
      continue;
    }
    if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if ((ch === ")" || ch === "]" || ch === "}") && depth > 0) depth--;
    else if (depth === 0 && (ch === ";" || ch === "}")) break;
    else if (depth === 0 && ch === "\n") {
      let j = i + 1;
      while (j < css.length && /\s/.test(css[j])) j++;
      if (propertyAt(css, j)) break;
    }
    i++;
  }
  return { value: css.slice(start, i).trim(), end: i };
}

/** Skip a selector, at-rule prelude or ordinary declaration: up to the next `;`, `{` or `}`. */
function skipChunk(css: string, start: number): number {
  let i = start;
  let depth = 0;
  while (i < css.length) {
    const ch = css[i];
    if (ch === '"' || ch === "'") {
      i = endOfString(css, i);
      continue;
    }
    if (ch === "(") depth++;
    else if (ch === ")" && depth > 0) depth--;
    else if (depth === 0 && (ch === ";" || ch === "{" || ch === "}")) return i;
    i++;
  }
  return i;
}

function declarations(css: string): Declaration[] {
  const found: Declaration[] = [];
  let i = 0;
  while (i < css.length) {
    while (i < css.length && /\s/.test(css[i])) i++;
    if (i >= css.length) break;
    const name = propertyAt(css, i);
    if (name) {
      const colon = css.indexOf(":", i + name.length);
      const { value, end } = readValue(css, colon + 1);
      found.push({ name, value: value.replace(/\s*!important$/i, "").trim() });
      i = end + 1;
    } else if ("{};".includes(css[i])) {
      i++;
    } else {
      i = Math.max(skipChunk(css, i), i + 1);
    }
  }
  return found;
}

/** Split a function's arguments on top-level commas. */
function splitArgs(text: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of text) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      args.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  args.push(current.trim());
  return args;
}

/** The text inside the parentheses that open at `open`, and the index after the close. */
function insideParens(text: string, open: number): { inner: string; end: number } | null {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")" && --depth === 0) return { inner: text.slice(open + 1, i), end: i + 1 };
  }
  return null;
}

class Resolver {
  constructor(private readonly values: ReadonlyMap<string, string>) {}

  /** Substitute every var() in `value`. Returns a problem message instead when it can't. */
  resolve(value: string, seen: ReadonlySet<string> = new Set()): string | { problem: string } {
    let out = "";
    let i = 0;
    for (;;) {
      const at = value.indexOf("var(", i);
      if (at === -1) break;
      const parens = insideParens(value, at + 3);
      if (!parens) return { problem: "Its var() is missing a closing bracket." };
      const [name, ...fallback] = splitArgs(parens.inner);
      let replacement: string | { problem: string };
      if (seen.has(name)) {
        return { problem: "Its var() loops back to itself. Point it at a property with a value." };
      } else if (this.values.has(name)) {
        replacement = this.resolve(this.values.get(name) ?? "", new Set([...seen, name]));
      } else if (fallback.length > 0) {
        replacement = this.resolve(fallback.join(","), seen);
      } else {
        return { problem: `Uses var(${name}), which isn't in the pasted CSS. Paste the file that defines it too.` };
      }
      if (typeof replacement !== "string") return replacement;
      out += value.slice(i, at) + replacement;
      i = parens.end;
    }
    return lightValue((out + value.slice(i)).trim());
  }
}

/** light-dark(a, b) → a, since the light theme is the default everywhere else too. */
function lightValue(value: string): string {
  if (!/^light-dark\(/i.test(value)) return value;
  const parens = insideParens(value, value.indexOf("("));
  return parens && parens.end === value.length ? lightValue(splitArgs(parens.inner)[0] ?? value) : value;
}

const FONT_NAME = /font|family|typeface/;
const NOT_FONT_FAMILY = /size|weight|leading|line|height|spacing|tracking|style|feature|variation|stretch|smoothing|kerning|optical/;
const COLOUR_LIKE = /^(?:#[0-9a-f]+|(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(.*)$/i;

function classify(
  name: string,
  value: string,
): { type: TokenType; value: string; alpha?: number } | { problem: string } | null {
  const lower = name.toLowerCase();
  const nameSaysFont = FONT_NAME.test(lower) && !NOT_FONT_FAMILY.test(lower);
  if (nameSaysFont && isFontStack(value, true)) {
    const family = normaliseFontFamily(value);
    if (family) return { type: "fontFamily", value: family };
  }
  const colour = normaliseCssColour(value);
  if (colour) return { type: "color", value: colour.hex, ...(colour.alpha === undefined ? {} : { alpha: colour.alpha }) };
  if (COLOUR_LIKE.test(value)) {
    return { problem: `"${value}" isn't a colour Linework can read. Use hex, rgb() or oklch().` };
  }
  const dimension = normaliseDimensionString(value);
  if (dimension && looksLikeFontSize(lower)) return { type: "dimension", value: dimension };
  if (isFontStack(value, false)) {
    const family = normaliseFontFamily(value);
    if (family) return { type: "fontFamily", value: family };
  }
  return null;
}

export function parseCss(text: string): ParseResult {
  if (text.trim() === "") {
    return failed("The CSS is empty. Paste custom properties, like --color-primary: #1F6FEB;");
  }
  const css = stripComments(text);
  if (typeof css !== "string") {
    return failed(`Line ${css.line} opens a comment that never closes. Add */ to close it.`, css.line);
  }

  const all = declarations(css);
  if (all.length === 0) {
    return failed("No custom properties found. Paste lines like --color-primary: #1F6FEB;");
  }

  const first = new Map<string, string>();
  const repeated = new Set<string>();
  for (const { name, value } of all) {
    if (value === "") continue;
    if (first.has(name)) {
      if (first.get(name) !== value) repeated.add(name);
    } else {
      first.set(name, value);
    }
  }

  const resolver = new Resolver(first);
  const warnings: ParseWarning[] = [];
  const drafts: TokenDraft[] = [];
  let skipped = 0;

  for (const [name, raw] of first) {
    const value = resolver.resolve(raw);
    if (typeof value !== "string") {
      warnings.push({ path: name, message: value.problem });
      continue;
    }
    const token = classify(name, value);
    if (token === null) {
      skipped++;
    } else if ("problem" in token) {
      warnings.push({ path: name, message: token.problem });
    } else {
      drafts.push({ path: name, ...token, source: "css" });
    }
  }

  if (repeated.size > 0) {
    const [firstName] = repeated;
    const others = repeated.size - 1;
    warnings.push({
      path: firstName,
      message:
        others === 0
          ? "Declared more than once with different values. Linework uses the first."
          : `This and ${others} other ${others === 1 ? "property are" : "properties are"} declared more than once with different values. Linework uses the first value of each.`,
    });
  }

  return parsed(drafts, warnings, skipped);
}
