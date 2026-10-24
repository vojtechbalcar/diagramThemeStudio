/**
 * W3C Design Tokens (DTCG) JSON → Token[].
 *
 * Reads the 2025.10 format (structured colour and dimension values,
 * `{a.b}` and `$ref` references, `$type` inheritance, `$extends`, `$root`)
 * and the older string-valued form many tools still write, including
 * Style Dictionary and Tokens Studio files that use `value`/`type`
 * without the `$`. Figma's native variables export is DTCG with
 * `com.figma.*` extensions, so parse-figma.ts reuses this reader.
 *
 * Linework only uses colours, font families and font sizes. Dimension
 * tokens are kept when their name says they are a font size; spacing,
 * radii, shadows and the rest are counted as skipped, not warned about.
 */

import type { TokenSource, TokenType } from "@/lib/model";
import {
  DTCG_COLOUR_SPACES,
  normaliseCssColour,
  normaliseDtcgColour,
  type Component,
  type NormalisedColour,
} from "./colour";
import { parseJson } from "./json";
import { failed, gamutWarning, parsed, type ParseResult, type ParseWarning, type TokenDraft } from "./result";
import { looksLikeFontSize, normaliseDimension, normaliseDimensionString, normaliseFontFamily } from "./values";

type JsonObject = { [key: string]: unknown };

type Format = "dtcg" | "legacy";

type RawToken = {
  path: string;
  value: unknown;
  /** The token's own $type. */
  ownType: string | undefined;
  /** The nearest group's $type (DTCG only). */
  groupType: string | undefined;
  extensions: unknown;
};

type Resolved = { value: unknown; type: string | undefined; extensions: unknown };

const MAX_DEPTH = 32;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function joinPath(segments: readonly string[]): string {
  return segments.join(".");
}

/** A file is DTCG if any token uses `$value`; otherwise it is the legacy `value` form. */
function detectFormat(root: JsonObject): Format {
  const stack: unknown[] = [root];
  let visited = 0;
  while (stack.length > 0 && visited++ < 100_000) {
    const node = stack.pop();
    if (!isObject(node)) continue;
    if ("$value" in node) return "dtcg";
    stack.push(...Object.values(node));
  }
  return "legacy";
}

/** Figma writes variable scopes into $extensions; find them wherever they sit. */
function figmaScopes(extensions: unknown): string[] {
  if (!isObject(extensions)) return [];
  const scopes: string[] = [];
  for (const [key, entry] of Object.entries(extensions)) {
    if (!key.startsWith("com.figma")) continue;
    const candidates = Array.isArray(entry) ? [entry] : isObject(entry) ? Object.values(entry) : [];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) scopes.push(...candidate.filter((s): s is string => typeof s === "string"));
    }
  }
  return scopes;
}

const ALIAS = /^\{([^{}]+)\}$/;

/** The path a whole-value reference points at, "partial" for a pointer into a value, or null. */
function referenceOf(value: unknown): string | "partial" | null {
  if (typeof value === "string") {
    const match = ALIAS.exec(value.trim());
    return match ? match[1].trim() : null;
  }
  if (isObject(value) && typeof value.$ref === "string" && Object.keys(value).length === 1) {
    const pointer = value.$ref;
    if (!pointer.startsWith("#/")) return "partial";
    const segments = pointer
      .slice(2)
      .split("/")
      .map((s) => s.replaceAll("~1", "/").replaceAll("~0", "~"));
    if (segments.at(-1) === "$value") segments.pop();
    if (segments.includes("$value")) return "partial";
    return joinPath(segments);
  }
  return null;
}

function isComponent(value: unknown): value is Component {
  return value === "none" || (typeof value === "number" && Number.isFinite(value));
}

function hasReference(value: unknown): boolean {
  return (typeof value === "string" && value.includes("{")) || (isObject(value) && "$ref" in value);
}

const COLOUR_HELP = "Use hex, rgb() or oklch().";

function readColour(value: unknown): NormalisedColour | string {
  if (typeof value === "string") {
    return normaliseCssColour(value) ?? `"${value}" isn't a colour Linework can read. ${COLOUR_HELP}`;
  }
  if (!isObject(value)) return `Its value isn't a colour. ${COLOUR_HELP}`;

  const { colorSpace, components, alpha, hex } = value;
  const fallback = typeof hex === "string" ? normaliseCssColour(hex) : null;
  const opacity = typeof alpha === "number" && alpha >= 0 && alpha <= 1 ? alpha : undefined;
  const space = DTCG_COLOUR_SPACES.find((s) => s === colorSpace);

  if (!space) {
    if (fallback) return { ...fallback, ...(opacity === undefined ? {} : { alpha: opacity }) };
    return `Colour space "${String(colorSpace)}" isn't supported. Use srgb, display-p3 or oklch.`;
  }
  if (!Array.isArray(components) || components.length !== 3 || !components.every(isComponent)) {
    if (Array.isArray(components) && components.some(hasReference)) {
      return "Linework can't read references inside a colour's components. Reference the whole colour instead.";
    }
    return "Its components must be three numbers.";
  }
  // Outside sRGB, the author's own hex fallback beats our gamut mapping.
  if (space !== "srgb" && fallback) {
    const result: NormalisedColour = { hex: fallback.hex, mapped: false };
    const a = opacity ?? fallback.alpha;
    return a === undefined || a >= 1 ? result : { ...result, alpha: a };
  }
  const result = normaliseDtcgColour(space, [components[0], components[1], components[2]], opacity);
  return result ?? `Its components aren't a colour Linework can read. ${COLOUR_HELP}`;
}

function readDimension(value: unknown): string | null {
  if (typeof value === "string") return normaliseDimensionString(value) ?? normaliseBareNumber(value);
  if (typeof value === "number") return normaliseDimension(value, "px");
  if (isObject(value) && typeof value.value === "number" && typeof value.unit === "string") {
    return normaliseDimension(value.value, value.unit);
  }
  return null;
}

/** Tokens Studio writes font sizes as bare numbers: "16" means 16px. */
function normaliseBareNumber(value: string): string | null {
  return /^\d*\.?\d+$/.test(value.trim()) ? normaliseDimension(Number(value), "px") : null;
}

/** The Linework token type for a declared (or missing) DTCG type, or null to skip. */
function tokenTypeOf(declared: string | undefined, resolved: Resolved, path: string): TokenType | null {
  const scopes = figmaScopes(resolved.extensions);
  switch (declared) {
    case "color":
      return "color";
    case "fontFamily":
    case "fontFamilies":
      return "fontFamily";
    case "fontSize":
    case "fontSizes":
      return "dimension";
    case "dimension":
      return looksLikeFontSize(path) ? "dimension" : null;
    case "number":
    case "float":
      return scopes.includes("FONT_SIZE") ? "dimension" : null;
    case "string":
      return scopes.includes("FONT_FAMILY") ? "fontFamily" : null;
    case undefined:
      return inferType(resolved.value, path);
    default:
      return null;
  }
}

/** Untyped tokens: only unambiguous colours, and px/rem values named like font sizes. */
function inferType(value: unknown, path: string): TokenType | null {
  if (isObject(value) && "colorSpace" in value) return "color";
  if (typeof value === "string") {
    const text = value.trim();
    if (/^#[0-9a-f]{3,8}$/i.test(text) || /^(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i.test(text)) {
      return "color";
    }
  }
  if (readDimension(value) !== null && typeof value !== "number" && looksLikeFontSize(path)) return "dimension";
  return null;
}

class Reader {
  private readonly tokens = new Map<string, RawToken>();
  readonly warnings: ParseWarning[] = [];

  constructor(
    private readonly root: JsonObject,
    private readonly format: Format,
  ) {}

  collect(): void {
    this.walk(this.root, [], "", undefined, []);
  }

  private valueKey(): "$value" | "value" {
    return this.format === "dtcg" ? "$value" : "value";
  }

  private groupAt(path: string): JsonObject | null {
    let node: unknown = this.root;
    for (const segment of path.split(".")) {
      if (!isObject(node)) return null;
      node = node[segment];
    }
    return isObject(node) && !(this.valueKey() in node) ? node : null;
  }

  /**
   * `segments` is where tokens land; `identity` is the group's own path in
   * the file, which differs while walking a group pulled in by $extends.
   * `chain` holds the identities being expanded, to stop $extends loops.
   */
  private walk(
    node: JsonObject,
    segments: readonly string[],
    identity: string,
    inherited: string | undefined,
    chain: readonly string[],
  ): void {
    if (segments.length > MAX_DEPTH) return;
    const groupType = this.format === "dtcg" && typeof node.$type === "string" ? node.$type : inherited;

    if (this.format === "dtcg" && typeof node.$extends === "string") {
      const target = referenceOf(node.$extends);
      const group = target && target !== "partial" ? this.groupAt(target) : null;
      const at = joinPath(segments);
      if (!target || target === "partial" || !group) {
        this.warnings.push({ path: at, message: `Extends ${node.$extends}, which isn't a group in the file.` });
      } else if (target === identity || chain.includes(target)) {
        this.warnings.push({ path: at, message: "Its $extends loops back to itself. Remove one of them." });
      } else {
        // Inherited tokens first, so the group's own tokens override them.
        this.walk(group, segments, target, groupType, [...chain, identity]);
      }
    }

    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith("$") && key !== "$root") continue;
      if (!isObject(child)) continue;
      const childSegments = [...segments, key];
      if (this.valueKey() in child) {
        this.addToken(childSegments, child, groupType);
      } else {
        const childIdentity = identity === "" ? key : `${identity}.${key}`;
        this.walk(child, childSegments, childIdentity, groupType, [...chain, identity]);
      }
    }
  }

  private addToken(segments: readonly string[], node: JsonObject, groupType: string | undefined): void {
    const declared = node[this.format === "dtcg" ? "$type" : "type"];
    const path = joinPath(segments);
    this.tokens.set(path, {
      path,
      value: node[this.valueKey()],
      ownType: typeof declared === "string" ? declared : undefined,
      groupType,
      extensions: node.$extensions,
    });
  }

  /** Follow references to a value; the type comes from the token, then its reference, then its group. */
  private resolve(token: RawToken, seen: ReadonlySet<string>): Resolved | string {
    const reference = referenceOf(token.value);
    if (reference === null) {
      return { value: token.value, type: token.ownType ?? token.groupType, extensions: token.extensions };
    }
    if (reference === "partial") {
      return "Linework can't read references into part of a value. Reference the whole token instead.";
    }
    if (seen.has(token.path)) return "Its reference loops back to itself. Point it at a token with a value.";
    const target = this.tokens.get(reference);
    if (!target) return `Refers to {${reference}}, which isn't in the file. Add that token or fix the reference.`;
    const resolved = this.resolve(target, new Set([...seen, token.path]));
    if (typeof resolved === "string") return resolved;
    return {
      value: resolved.value,
      type: token.ownType ?? resolved.type ?? token.groupType,
      extensions: token.extensions ?? resolved.extensions,
    };
  }

  read(source: TokenSource): ParseResult {
    const drafts: TokenDraft[] = [];
    const mapped: Array<{ path: string; hex: string }> = [];
    let skipped = 0;

    for (const token of this.tokens.values()) {
      const resolved = this.resolve(token, new Set());
      if (typeof resolved === "string") {
        this.warnings.push({ path: token.path, message: resolved });
        continue;
      }
      const type = tokenTypeOf(resolved.type, resolved, token.path);
      if (type === null) {
        skipped++;
        continue;
      }
      if (type === "color") {
        const colour = readColour(resolved.value);
        if (typeof colour === "string") {
          this.warnings.push({ path: token.path, message: colour });
          continue;
        }
        if (colour.mapped) mapped.push({ path: token.path, hex: colour.hex });
        drafts.push({
          path: token.path,
          type,
          value: colour.hex,
          ...(colour.alpha === undefined ? {} : { alpha: colour.alpha }),
          source,
        });
      } else if (type === "fontFamily") {
        const value = resolved.value;
        const family =
          typeof value === "string" || (Array.isArray(value) && value.every((v) => typeof v === "string"))
            ? normaliseFontFamily(value)
            : null;
        if (family === null) {
          this.warnings.push({ path: token.path, message: "Its value isn't a font name." });
          continue;
        }
        drafts.push({ path: token.path, type, value: family, source });
      } else {
        const dimension = readDimension(resolved.value);
        if (dimension === null) {
          this.warnings.push({ path: token.path, message: "Font sizes must be in px or rem, e.g. 16px." });
          continue;
        }
        drafts.push({ path: token.path, type, value: dimension, source });
      }
    }
    return parsed(drafts, [...this.warnings, ...gamutWarning(mapped)], skipped);
  }
}

/** Read an already-parsed DTCG document. */
export function readDtcg(root: unknown, source: TokenSource = "dtcg"): ParseResult {
  if (!isObject(root)) {
    return failed("This isn't a token file. Its top level must be an object of groups and tokens.");
  }
  const reader = new Reader(root, detectFormat(root));
  reader.collect();
  return reader.read(source);
}

export function parseDtcg(text: string): ParseResult {
  const json = parseJson(text);
  if (!json.ok) return failed(json.message, json.line);
  return readDtcg(json.value, "dtcg");
}
