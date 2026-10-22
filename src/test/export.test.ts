import { describe, expect, it } from "vitest";
import { exportConfig, exportTheme } from "@/lib/theme/export";
import { createEditorSet } from "@/lib/state/editor";
import { PRESETS } from "@/lib/tokens/presets";
import type { TokenSet } from "@/lib/model";

describe("Mermaid exports", () => {
  it("uses the base theme and the preview's strict, classic, text-label config", () => {
    expect(exportConfig(PRESETS[0].set)).toMatchObject({ startOnLoad: false, theme: "base", securityLevel: "strict", look: "classic", htmlLabels: false });
  });

  it("emits parseable JSON and equivalent init/initialize outputs", () => {
    for (const { set } of PRESETS) {
      const json = exportTheme("json", set);
      const config = exportConfig(set);
      expect(JSON.parse(json)).toEqual(config);
      const init = exportTheme("init", set);
      expect(init.startsWith("%%{init: ")).toBe(true);
      expect(init.endsWith("}%%")).toBe(true);
      expect(JSON.parse(init.slice(9, -3))).toEqual(config);
      let initialized: unknown;
      const run = new Function("mermaid", exportTheme("initialize", set));
      run({ initialize: (value: unknown) => { initialized = value; } });
      expect(initialized).toEqual(config);
    }
  });

  it("exports alpha over the selected surface and leaves unmapped roles derived", () => {
    const set: TokenSet = {
      ...createEditorSet(),
      surface: "ink",
      tokens: [{ id: "alpha", path: "brand", type: "color", value: "#FFFFFF", alpha: 0.5, source: "manual" }],
      mapping: { primaryColor: { tokenId: "alpha", auto: false } },
    };
    expect(exportConfig(set).themeVariables).toEqual({ primaryColor: "#858585" });
    expect(exportConfig({ ...set, surface: "paper" }).themeVariables).toEqual({ primaryColor: "#FFFFFF" });
    expect(exportConfig(createEditorSet()).themeVariables).toEqual({});
  });

  it("escapes strings without turning font names into executable code or directive delimiters", () => {
    const set = structuredClone(PRESETS[0].set);
    const font = set.tokens.find((token) => token.type === "fontFamily")!;
    font.value = 'A "quoted" font, sans-serif';
    expect(JSON.parse(exportTheme("json", set)).themeVariables.fontFamily).toBe(font.value);
    font.value = 'font}%%\nA-->B';
    expect(exportTheme("init", set).slice(0, -3)).not.toContain("}%%");
    expect(JSON.parse(exportTheme("init", set).slice(9, -3)).themeVariables.fontFamily).toBe(font.value);
  });
});
