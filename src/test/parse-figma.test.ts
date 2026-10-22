import { describe, expect, it } from "vitest";
import { TokenSchema } from "@/lib/model";
import { parseFigma } from "@/lib/tokens/parse-figma";
import type { ParseResult } from "@/lib/tokens/result";

function ok(result: ParseResult) {
  if (!result.ok) throw new Error(result.error.message);
  return result;
}

function values(result: ParseResult) {
  return Object.fromEntries(
    ok(result).tokens.map((t) => [t.path, t.alpha === undefined ? t.value : `${t.value} ${t.alpha}`]),
  );
}

const PRIMITIVES = "VariableCollectionId:1:1";
const THEME = "VariableCollectionId:1:2";

function variable(
  id: string,
  name: string,
  resolvedType: string,
  valuesByMode: Record<string, unknown>,
  extra: Record<string, unknown> = {},
) {
  return { id, name, key: id, variableCollectionId: id.startsWith("T") ? THEME : PRIMITIVES, resolvedType, valuesByMode, remote: false, description: "", hiddenFromPublishing: false, scopes: ["ALL_SCOPES"], codeSyntax: {}, ...extra };
}

/** A REST API response in the shape of GET /v1/files/:key/variables/local. */
function response(variables: ReturnType<typeof variable>[]) {
  return {
    status: 200,
    error: false,
    meta: {
      variableCollections: {
        [PRIMITIVES]: { id: PRIMITIVES, name: "Primitives", key: "p", modes: [{ modeId: "1:0", name: "Value" }], defaultModeId: "1:0", remote: false, hiddenFromPublishing: false, variableIds: [] },
        [THEME]: { id: THEME, name: "Theme", key: "t", modes: [{ modeId: "2:0", name: "Light" }, { modeId: "2:1", name: "Dark" }], defaultModeId: "2:0", remote: false, hiddenFromPublishing: false, variableIds: [] },
      },
      variables: Object.fromEntries(variables.map((v) => [v.id, v])),
    },
  };
}

describe("parseFigma — REST API response", () => {
  const file = response([
    variable("P1", "color/blue/500", "COLOR", { "1:0": { r: 0.1843, g: 0.3569, b: 0.8275, a: 1 } }),
    variable("P2", "color/ink", "COLOR", { "1:0": { r: 0.0706, g: 0.0706, b: 0.0706, a: 1 } }),
    variable("P3", "color/scrim", "COLOR", { "1:0": { r: 0, g: 0, b: 0, a: 0.6 } }),
    variable("P4", "font/size/body", "FLOAT", { "1:0": 15 }, { scopes: ["FONT_SIZE"] }),
    variable("P5", "spacing/4", "FLOAT", { "1:0": 16 }, { scopes: ["GAP"] }),
    variable("P6", "font/family/sans", "STRING", { "1:0": "Inter" }, { scopes: ["FONT_FAMILY"] }),
    variable("P7", "flag/beta", "BOOLEAN", { "1:0": true }),
    variable("T1", "primary", "COLOR", {
      "2:0": { type: "VARIABLE_ALIAS", id: "P1" },
      "2:1": { type: "VARIABLE_ALIAS", id: "P2" },
    }),
    variable("T2", "text", "COLOR", { "2:0": { type: "VARIABLE_ALIAS", id: "P2" }, "2:1": { r: 1, g: 1, b: 1, a: 1 } }),
  ]);

  it("reads colours, font sizes and families in each collection's default mode", () => {
    const result = ok(parseFigma(JSON.stringify(file)));
    expect(values(result)).toEqual({
      "color/blue/500": "#2F5BD3",
      "color/ink": "#121212",
      "color/scrim": "#000000 0.6",
      "font/size/body": "15px",
      "font/family/sans": "Inter",
      primary: "#2F5BD3",
      text: "#121212",
    });
    expect(result.skipped).toBe(2);
    for (const token of result.tokens) {
      expect(token.source).toBe("figma");
      expect(TokenSchema.safeParse(token).success).toBe(true);
    }
  });

  it("says which mode it used for collections with several", () => {
    expect(ok(parseFigma(JSON.stringify(file))).warnings).toEqual([
      { path: "Theme", message: 'Has 2 modes. Linework uses the default, "Light".' },
    ]);
  });

  it("also accepts the meta object on its own", () => {
    expect(values(parseFigma(JSON.stringify(file.meta)))).toEqual(values(parseFigma(JSON.stringify(file))));
  });

  it("prefixes the collection name only when names clash", () => {
    const clash = response([
      variable("P1", "color/brand", "COLOR", { "1:0": { r: 1, g: 0, b: 0, a: 1 } }),
      variable("T1", "color/brand", "COLOR", { "2:0": { r: 0, g: 0, b: 1, a: 1 } }),
    ]);
    expect(values(parseFigma(JSON.stringify(clash)))).toEqual({
      "Primitives/color/brand": "#FF0000",
      "Theme/color/brand": "#0000FF",
    });
  });

  it("warns about aliases to other files and alias loops", () => {
    const broken = response([
      variable("P1", "a", "COLOR", { "1:0": { type: "VARIABLE_ALIAS", id: "VariableID:remote" } }),
      variable("P2", "b", "COLOR", { "1:0": { type: "VARIABLE_ALIAS", id: "P3" } }),
      variable("P3", "c", "COLOR", { "1:0": { type: "VARIABLE_ALIAS", id: "P2" } }),
      { id: "P4", name: "d", resolvedType: "COLOR" },
    ] as ReturnType<typeof variable>[]);
    const result = ok(parseFigma(JSON.stringify(broken)));
    expect(result.tokens).toEqual([]);
    expect(result.warnings).toEqual([
      { path: "d", message: "This variable isn't in the shape Figma's API returns. Export it again." },
      { path: "a", message: "Refers to a variable from another file. Paste that library's variables too." },
      { path: "b", message: "Its alias loops back to itself. Point it at a variable with a value." },
      { path: "c", message: "Its alias loops back to itself. Point it at a variable with a value." },
    ]);
  });

  it("explains a pasted Figma error response", () => {
    expect(parseFigma(JSON.stringify({ status: 403, error: true, message: "Invalid token" }))).toEqual({
      ok: false,
      error: { message: "This is an error from Figma: Invalid token. Fetch the variables again and paste the result." },
    });
  });
});

describe("parseFigma — native DTCG export", () => {
  it("reads Figma's DTCG export and tags tokens as figma", () => {
    const exported = {
      color: {
        primary: {
          $type: "color",
          $value: { colorSpace: "srgb", components: [0.1843, 0.3569, 0.8275], alpha: 1, hex: "#2F5BD3" },
          $extensions: { "com.figma.variableId": "VariableID:1:2", "com.figma.scopes": ["ALL_SCOPES"] },
        },
      },
      "font-size": {
        body: { $type: "number", $value: 15, $extensions: { "com.figma.scopes": ["FONT_SIZE"] } },
      },
    };
    const result = ok(parseFigma(JSON.stringify(exported)));
    expect(result.tokens.map((t) => [t.path, t.value, t.source])).toEqual([
      ["color.primary", "#2F5BD3", "figma"],
      ["font-size.body", "15px", "figma"],
    ]);
  });
});
