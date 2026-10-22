import { describe, expect, it } from "vitest";
import { ROLES, TokenSetSchema, type Mapping, type Token } from "@/lib/model";
import {
  buildThemeVariables,
  defaultSurface,
  INK,
  mermaidConfig,
  PAPER,
  surfaceHex,
} from "@/lib/theme/build-theme";
import { DIAGRAMS } from "@/lib/theme/diagrams";
import { CONTRAST_PAIRS, glyphFor, pairsFor, pairsForRole, ROLE_DEFINITIONS, roleLabel } from "@/lib/theme/roles";
import { withIds, type TokenDraft } from "@/lib/tokens/result";

function tokens(...drafts: Array<Omit<TokenDraft, "source">>): Token[] {
  return withIds(drafts.map((d) => ({ ...d, source: "manual" as const })));
}

function mapping(set: Token[], roles: Record<string, string>): Mapping {
  return Object.fromEntries(
    Object.entries(roles).map(([role, path]) => {
      const token = set.find((t) => t.path === path);
      if (!token) throw new Error(path);
      return [role, { tokenId: token.id, auto: false }];
    }),
  );
}

describe("roles", () => {
  it("lists every role once, in panel order, with the manual's labels", () => {
    expect(ROLE_DEFINITIONS.map((r) => r.role)).toEqual([...ROLES]);
    expect(ROLE_DEFINITIONS.map((r) => r.label)).toEqual([
      "Primary fill",
      "Primary text",
      "Primary border",
      "Secondary fill",
      "Tertiary fill",
      "Line",
      "Background",
      "Note fill",
      "Note text",
      "Font family",
      "Font size",
    ]);
    expect(roleLabel("noteBkgColor")).toBe("Note fill");
  });

  it("gives colour roles a glyph and font roles none", () => {
    for (const role of ROLE_DEFINITIONS) {
      expect(role.glyph === null, role.role).toBe(role.tokenType !== "color");
    }
  });

  it("takes a token's glyph from the first role it fills", () => {
    const set = tokens(
      { path: "ink", type: "color", value: "#111111" },
      { path: "paper", type: "color", value: "#FFFFFF" },
      { path: "spare", type: "color", value: "#888888" },
    );
    const m = mapping(set, { lineColor: "ink", primaryTextColor: "ink", background: "paper" });
    expect(glyphFor(set[0].id, m)).toBe("P");
    expect(glyphFor(set[1].id, m)).toBe("B");
    expect(glyphFor(set[2].id, m)).toBeNull();
  });

  it("defines seven pairs, each on at least one diagram, with unique ids", () => {
    expect(CONTRAST_PAIRS).toHaveLength(7);
    expect(new Set(CONTRAST_PAIRS.map((p) => p.id)).size).toBe(7);
    for (const pair of CONTRAST_PAIRS) {
      expect(pair.diagrams.length, pair.id).toBeGreaterThan(0);
      expect(pair.roles.length, pair.id).toBeGreaterThan(0);
    }
    for (const diagram of DIAGRAMS) expect(pairsFor(diagram.kind).length, diagram.kind).toBeGreaterThan(0);
    expect(pairsForRole("noteTextColor").map((p) => p.id)).toEqual(["note-text"]);
    expect(pairsForRole("fontSize")).toEqual([]);
  });
});

describe("buildThemeVariables", () => {
  const set = tokens(
    { path: "brand", type: "color", value: "#2F5BD3" },
    { path: "white", type: "color", value: "#FFFFFF" },
    { path: "paper", type: "color", value: "#FBFAF6" },
    { path: "scrim", type: "color", value: "#000000", alpha: 0.5 },
    { path: "night", type: "color", value: "#0F1420" },
    { path: "font", type: "fontFamily", value: '"Helvetica Neue", Arial, sans-serif' },
    { path: "size", type: "dimension", value: "0.875rem" },
  );

  it("emits mapped roles only, in panel order, as hex", () => {
    const vars = buildThemeVariables(
      set,
      mapping(set, { fontSize: "size", primaryColor: "brand", primaryTextColor: "white", fontFamily: "font" }),
    );
    expect(vars).toEqual({
      primaryColor: "#2F5BD3",
      primaryTextColor: "#FFFFFF",
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: "14px",
    });
    expect(Object.keys(vars)).toEqual(["primaryColor", "primaryTextColor", "fontFamily", "fontSize"]);
  });

  it("composites translucent colours over the background, or the given backdrop", () => {
    const m = mapping(set, { background: "paper", lineColor: "scrim" });
    expect(buildThemeVariables(set, m).lineColor).toBe("#7E7D7B");
    expect(buildThemeVariables(set, m, { backdrop: INK }).lineColor).toBe("#060606");
    expect(buildThemeVariables(set, mapping(set, { lineColor: "scrim" })).lineColor).toBe("#808080");
  });

  it("sets darkMode only for a dark mapped background", () => {
    expect(buildThemeVariables(set, mapping(set, { background: "night" })).darkMode).toBe(true);
    expect(buildThemeVariables(set, mapping(set, { background: "paper" }))).not.toHaveProperty("darkMode");
    expect(buildThemeVariables(set, {})).toEqual({});
  });

  it("ignores stale or mistyped mappings", () => {
    const m: Mapping = {
      primaryColor: { tokenId: "gone", auto: false },
      fontFamily: { tokenId: set[0].id, auto: false },
    };
    expect(buildThemeVariables(set, m)).toEqual({});
  });

  it("wraps variables in the fixed base config", () => {
    expect(mermaidConfig({ primaryColor: "#2F5BD3" })).toEqual({
      startOnLoad: false,
      theme: "base",
      securityLevel: "strict",
      look: "classic",
      themeVariables: { primaryColor: "#2F5BD3" },
    });
  });
});

describe("surfaces", () => {
  const set = tokens({ path: "paper", type: "color", value: "#FBFAF6" });

  it("resolves each preview surface to a colour", () => {
    const m = mapping(set, { background: "paper" });
    expect(surfaceHex("paper", set, m)).toBe(PAPER);
    expect(surfaceHex("ink", set, m)).toBe(INK);
    expect(surfaceHex("brand", set, m)).toBe("#FBFAF6");
    expect(surfaceHex("brand", set, {})).toBe(PAPER);
  });

  it("defaults to Brand when a background is mapped", () => {
    expect(defaultSurface(set, mapping(set, { background: "paper" }))).toBe("brand");
    expect(defaultSurface(set, {})).toBe("paper");
  });
});

describe("TokenSetSchema", () => {
  const set = tokens({ path: "a", type: "color", value: "#FFFFFF" }, { path: "f", type: "fontFamily", value: "Inter" });

  it("accepts a valid set", () => {
    const result = TokenSetSchema.safeParse({
      version: 1,
      name: "Untitled set",
      tokens: set,
      mapping: mapping(set, { background: "a", fontFamily: "f" }),
      surface: "brand",
    });
    expect(result.success).toBe(true);
  });

  it("rejects bad colours, dangling or mistyped mappings and unknown versions", () => {
    const base = { version: 1, name: "x", tokens: set, mapping: {}, surface: "paper" };
    const bad = [
      { ...base, version: 2 },
      { ...base, tokens: [{ ...set[0], value: "#fff" }] },
      { ...base, tokens: [{ ...set[1], alpha: 0.5 }] },
      { ...base, tokens: [set[0], set[0]] },
      { ...base, mapping: { primaryColor: { tokenId: "missing", auto: false } } },
      { ...base, mapping: { primaryColor: { tokenId: set[1].id, auto: false } } },
      { ...base, mapping: { notARole: { tokenId: set[0].id, auto: false } } },
      { ...base, surface: "white" },
    ];
    for (const value of bad) expect(TokenSetSchema.safeParse(value).success, JSON.stringify(value)).toBe(false);
  });
});
