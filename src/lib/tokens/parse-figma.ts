/**
 * Figma variables → Token[].
 *
 * Two shapes arrive here:
 * - Figma's own "Export variables" file, which is DTCG JSON with
 *   `com.figma.*` extensions; it goes through the DTCG reader.
 * - The REST API response from GET /v1/files/:key/variables/local
 *   (or just its `meta` object): variables keyed by id, values per mode,
 *   aliases as { type: "VARIABLE_ALIAS", id }.
 *
 * Each collection is read in its default mode. Paths are variable names
 * as Figma shows them (`color/brand/primary`), prefixed with the
 * collection name only when two collections share a name.
 */

import { z } from "zod";
import { normaliseDtcgColour } from "./colour";
import { parseJson } from "./json";
import { readDtcg } from "./parse-dtcg";
import { failed, parsed, type ParseResult, type ParseWarning, type TokenDraft } from "./result";
import { looksLikeFontSize, normaliseDimension, normaliseFontFamily } from "./values";

const AliasSchema = z.object({ type: z.literal("VARIABLE_ALIAS"), id: z.string() });
const RgbaSchema = z.object({ r: z.number(), g: z.number(), b: z.number(), a: z.number().optional() });
const ValueSchema = z.union([AliasSchema, RgbaSchema, z.number(), z.string(), z.boolean()]);

const VariableSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  variableCollectionId: z.string(),
  resolvedType: z.enum(["BOOLEAN", "FLOAT", "STRING", "COLOR"]),
  valuesByMode: z.record(z.string(), ValueSchema),
  scopes: z.array(z.string()).optional(),
  deletedButReferenced: z.boolean().optional(),
});

const CollectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  modes: z.array(z.object({ modeId: z.string(), name: z.string() })),
  defaultModeId: z.string(),
});

/** Only the envelope is strict; each variable is checked on its own so one bad entry doesn't sink the file. */
const EnvelopeSchema = z.object({
  variables: z.record(z.string(), z.unknown()),
  variableCollections: z.record(z.string(), z.unknown()),
});

const ErrorResponseSchema = z.object({ error: z.literal(true), message: z.string().optional() });

type Variable = z.infer<typeof VariableSchema>;
type Collection = z.infer<typeof CollectionSchema>;
type Value = z.infer<typeof ValueSchema>;

function envelopeOf(json: unknown): z.infer<typeof EnvelopeSchema> | null {
  const direct = EnvelopeSchema.safeParse(json);
  if (direct.success) return direct.data;
  const wrapped = z.object({ meta: EnvelopeSchema }).safeParse(json);
  return wrapped.success ? wrapped.data.meta : null;
}

const FONT_FAMILY_NAME = /font|family|typeface/i;

class RestReader {
  private readonly variables = new Map<string, Variable>();
  private readonly collections = new Map<string, Collection>();
  private readonly warnings: ParseWarning[] = [];

  constructor(envelope: z.infer<typeof EnvelopeSchema>) {
    for (const [id, raw] of Object.entries(envelope.variableCollections)) {
      const collection = CollectionSchema.safeParse(raw);
      if (collection.success) this.collections.set(id, collection.data);
    }
    for (const [id, raw] of Object.entries(envelope.variables)) {
      const variable = VariableSchema.safeParse(raw);
      if (variable.success) {
        this.variables.set(id, variable.data);
      } else {
        const name = z.object({ name: z.string() }).safeParse(raw);
        this.warnings.push({
          path: name.success ? name.data.name : id,
          message: "This variable isn't in the shape Figma's API returns. Export it again.",
        });
      }
    }
  }

  /** The variable's value in its collection's default mode. */
  private valueOf(variable: Variable): Value | undefined {
    const collection = this.collections.get(variable.variableCollectionId);
    const mode = collection?.defaultModeId;
    return (mode === undefined ? undefined : variable.valuesByMode[mode]) ?? Object.values(variable.valuesByMode)[0];
  }

  private resolve(variable: Variable, seen: ReadonlySet<string>): Value | { problem: string } {
    const value = this.valueOf(variable);
    if (value === undefined) return { problem: "It has no value in any mode." };
    const alias = AliasSchema.safeParse(value);
    if (!alias.success) return value;
    if (seen.has(alias.data.id)) return { problem: "Its alias loops back to itself. Point it at a variable with a value." };
    const target = this.variables.get(alias.data.id);
    if (!target) {
      return { problem: "Refers to a variable from another file. Paste that library's variables too." };
    }
    return this.resolve(target, new Set([...seen, target.id]));
  }

  read(): ParseResult {
    // Paths are names as written, unless two collections use the same name.
    const nameCount = new Map<string, number>();
    for (const variable of this.variables.values()) {
      nameCount.set(variable.name, (nameCount.get(variable.name) ?? 0) + 1);
    }

    const drafts: TokenDraft[] = [];
    const usedCollections = new Set<string>();
    let skipped = 0;

    for (const variable of this.variables.values()) {
      if (variable.deletedButReferenced) continue;
      const collection = this.collections.get(variable.variableCollectionId);
      const path =
        (nameCount.get(variable.name) ?? 0) > 1 && collection ? `${collection.name}/${variable.name}` : variable.name;
      const scopes = variable.scopes ?? [];
      const anyScope = scopes.length === 0 || scopes.includes("ALL_SCOPES");

      let type: TokenDraft["type"] | null = null;
      if (variable.resolvedType === "COLOR") type = "color";
      else if (variable.resolvedType === "FLOAT" && (scopes.includes("FONT_SIZE") || (anyScope && looksLikeFontSize(path)))) {
        type = "dimension";
      } else if (
        variable.resolvedType === "STRING" &&
        (scopes.includes("FONT_FAMILY") || (anyScope && FONT_FAMILY_NAME.test(path)))
      ) {
        type = "fontFamily";
      }
      if (type === null) {
        skipped++;
        continue;
      }

      const value = this.resolve(variable, new Set([variable.id]));
      if (typeof value === "object" && "problem" in value) {
        this.warnings.push({ path, message: value.problem });
        continue;
      }
      if (collection) usedCollections.add(collection.id);

      const draft = this.draft(path, type, value);
      if (typeof draft === "string") this.warnings.push({ path, message: draft });
      else drafts.push(draft);
    }

    for (const id of usedCollections) {
      const collection = this.collections.get(id);
      if (!collection || collection.modes.length < 2) continue;
      const mode = collection.modes.find((m) => m.modeId === collection.defaultModeId) ?? collection.modes[0];
      this.warnings.push({
        path: collection.name,
        message: `Has ${collection.modes.length} modes. Linework uses the default, "${mode.name}".`,
      });
    }

    return parsed(drafts, this.warnings, skipped);
  }

  private draft(path: string, type: TokenDraft["type"], value: Value): TokenDraft | string {
    if (type === "color") {
      const rgba = RgbaSchema.safeParse(value);
      const colour = rgba.success
        ? normaliseDtcgColour("srgb", [rgba.data.r, rgba.data.g, rgba.data.b], rgba.data.a)
        : null;
      if (!colour) return "Its value isn't a colour.";
      return { path, type, value: colour.hex, ...(colour.alpha === undefined ? {} : { alpha: colour.alpha }), source: "figma" };
    }
    if (type === "dimension") {
      const size = typeof value === "number" ? normaliseDimension(value, "px") : null;
      return size ? { path, type, value: size, source: "figma" } : "Its value isn't a font size.";
    }
    const family = typeof value === "string" ? normaliseFontFamily(value) : null;
    return family ? { path, type, value: family, source: "figma" } : "Its value isn't a font name.";
  }
}

export function parseFigma(text: string): ParseResult {
  const json = parseJson(text);
  if (!json.ok) return failed(json.message, json.line);

  const error = ErrorResponseSchema.safeParse(json.value);
  if (error.success) {
    const reason = error.data.message ? `: ${error.data.message}` : "";
    return failed(`This is an error from Figma${reason}. Fetch the variables again and paste the result.`);
  }

  const envelope = envelopeOf(json.value);
  return envelope ? new RestReader(envelope).read() : readDtcg(json.value, "figma");
}
