import { describe, expect, it } from "vitest";
import { createEditorSet, editorReducer, editToken } from "@/lib/state/editor";
import { importTokens } from "@/lib/tokens/import";
import { PRESETS } from "@/lib/tokens/presets";
import type { Token } from "@/lib/model";

const colour: Token = { id: "manual-colour", path: "color.primary", type: "color", value: "#FFFFFF", source: "manual" };

describe("editor state", () => {
  it("starts empty and imports tokens with auto-mapping and a suitable surface", () => {
    expect(createEditorSet().tokens).toEqual([]);
    const result = importTokens("css", ":root { --primary: #f00; --background: #fff; }");
    if (!result.ok) throw new Error(result.error.message);
    const set = createEditorSet(result.tokens);
    expect(set.mapping.primaryColor?.auto).toBe(true);
    expect(set.surface).toBe("brand");
  });

  it("replaces a set without mutating the preset when editing or renaming", () => {
    const preset = PRESETS[0].set;
    const state = editorReducer(createEditorSet(), { type: "replace", set: preset });
    const changed = editorReducer(state, { type: "token", token: { ...state.tokens[0], value: "#123456" } });
    expect(changed.tokens[0].id).toBe(preset.tokens[0].id);
    expect(preset.tokens[0].value).toBe("#111111");
    expect(editorReducer(changed, { type: "name", name: "My set" }).name).toBe("My set");
  });

  it("rejects invalid tokens, incompatible role mappings and missing tokens", () => {
    const state = createEditorSet([colour]);
    expect(editorReducer(state, { type: "token", token: { ...colour, value: "broken" } })).toBe(state);
    expect(editorReducer(state, { type: "map", role: "fontFamily", tokenId: colour.id })).toBe(state);
    expect(editorReducer(state, { type: "map", role: "primaryColor", tokenId: "missing" })).toBe(state);
    expect(editorReducer(state, { type: "name", name: "x".repeat(81) })).toBe(state);
  });

  it("confirms guesses, preserves confirmed mappings during auto-map, and unmaps to Derived", () => {
    const state = createEditorSet([colour]);
    const confirmed = editorReducer(state, { type: "map", role: "primaryColor", tokenId: colour.id });
    expect(confirmed.mapping.primaryColor).toEqual({ tokenId: colour.id, auto: false });
    expect(editorReducer(confirmed, { type: "automap" }).mapping.primaryColor?.auto).toBe(false);
    expect(editorReducer(confirmed, { type: "map", role: "primaryColor", tokenId: "" }).mapping.primaryColor).toBeUndefined();
  });

  it("normalises editable values, preserves alpha on hex-only edits, and accepts explicit alpha", () => {
    const translucent = { ...colour, alpha: 0.4 };
    expect(editToken(translucent, "#abc", "  color.brand  ")).toMatchObject({ value: "#AABBCC", path: "color.brand", alpha: 0.4 });
    expect(editToken(translucent, "#abc8")?.alpha).toBeCloseTo(0.5333, 3);
    expect(editToken(translucent, "#abc", colour.path, 1)?.alpha).toBeUndefined();
    expect(editToken(translucent, "#abcF")?.alpha).toBeUndefined();
    expect(editToken(translucent, "#AABBCCFF")?.alpha).toBeUndefined();
    expect(editToken(translucent, "rgba(255, 0, 0, 1)")?.alpha).toBeUndefined();
    expect(editToken(colour, "not a colour")).toBeNull();
    expect(editToken(colour, "#fff", "")).toBeNull();
    expect(editToken(colour, "#fff", colour.path, 1.01)).toBeNull();
    expect(editToken(colour, "#fff", colour.path, Number.NaN)).toBeNull();
  });

  it("normalises typography and rejects unusable values", () => {
    const font: Token = { ...colour, type: "fontFamily", value: "Inter" };
    const size: Token = { ...colour, type: "dimension", value: "14px" };
    expect(editToken(font, '"Helvetica Neue", sans-serif')?.value).toBe('"Helvetica Neue", sans-serif');
    expect(editToken(font, "x; color:red")).toBeNull();
    expect(editToken(size, "1.50rem")?.value).toBe("1.5rem");
    expect(editToken(size, "0px")).toBeNull();
    expect(editToken(size, "-3px")).toBeNull();
  });
});

describe("import format selection", () => {
  it("uses each parser and reports errors without replacing the current set", () => {
    expect(importTokens("dtcg", '{"brand":{"$type":"color","$value":"#123456"}}').ok).toBe(true);
    expect(importTokens("figma", '{"brand":{"$type":"color","$value":"#123456"}}').ok).toBe(true);
    expect(importTokens("dtcg", "not JSON").ok).toBe(false);
  });

  it("rejects oversized imports and invalid token values before creating editor state", () => {
    const excessive = Array.from({ length: 1001 }, (_, index) => `--brand-${index}: #fff;`).join("\n");
    expect(importTokens("css", excessive).ok).toBe(false);
    expect(importTokens("css", `--${"x".repeat(301)}: #fff;`).ok).toBe(false);
  });
});
