import { describe, expect, it } from "vitest";
import { checkPairs, type ColourLookup } from "@/lib/contrast/check";
import { ROLES, TokenSetSchema } from "@/lib/model";
import { buildThemeVariables, surfaceHex, type ThemeVariables } from "@/lib/theme/build-theme";
import { presetById, PRESETS } from "@/lib/tokens/presets";
import { describeTokens } from "@/lib/tokens/summary";

/**
 * The variables the pairs read, as Mermaid 12's base theme derives them
 * from the roles we set (themes/theme-base updateColors). Variables it
 * computes with colour maths are left unknown here; M3 checks against the
 * values read back from Mermaid itself.
 */
function mermaidLookup(vars: ThemeVariables): ColourLookup {
  const derived = {
    mainBkg: vars.primaryColor,
    nodeTextColor: vars.primaryTextColor,
    nodeBorder: vars.primaryBorderColor,
    actorLineColor: vars.primaryBorderColor,
    noteBkgColor: vars.noteBkgColor,
    noteTextColor: vars.noteTextColor,
    textColor: vars.primaryTextColor,
    lineColor: vars.lineColor,
    // In dark mode Mermaid darkens the secondary colour for edge labels.
    edgeLabelBackground: vars.darkMode ? undefined : vars.secondaryColor,
    clusterBkg: vars.tertiaryColor,
    titleColor: undefined,
  };
  return (variable) => derived[variable];
}

describe("presets", () => {
  it("are the four from the manual, in order", () => {
    expect(PRESETS.map((p) => p.set.name)).toEqual(["Ink & paper", "Signal", "Forest", "Night"]);
    expect(presetById("forest")?.set.name).toBe("Forest");
    expect(presetById("nope")).toBeUndefined();
  });

  it("are valid token sets with every role mapped and confirmed", () => {
    for (const { set } of PRESETS) {
      expect(TokenSetSchema.safeParse(set).success, set.name).toBe(true);
      expect(Object.keys(set.mapping), set.name).toEqual([...ROLES]);
      expect(Object.values(set.mapping).every((entry) => entry?.auto === false), set.name).toBe(true);
      expect(set.tokens.every((t) => t.source === "preset"), set.name).toBe(true);
      expect(set.surface).toBe("brand");
    }
  });

  it("pass every pair they can be checked on, on their own background", () => {
    for (const { set } of PRESETS) {
      const vars = buildThemeVariables(set.tokens, set.mapping);
      const checks = checkPairs(mermaidLookup(vars), surfaceHex("brand", set.tokens, set.mapping));
      expect(checks.length, set.name).toBeGreaterThanOrEqual(5);
      for (const check of checks) {
        expect(check.outcome, `${set.name}: ${check.pair.name} ${check.ratio.toFixed(2)}`).toBe("pass");
      }
    }
  });

  it("describe themselves for the import count", () => {
    expect(PRESETS.map((p) => describeTokens(p.set.tokens))).toEqual([
      "6 colours, 1 font, 1 size",
      "6 colours, 1 font, 1 size",
      "7 colours, 1 font, 1 size",
      "9 colours, 1 font, 1 size",
    ]);
  });

  it("only Night is dark", () => {
    expect(PRESETS.map((p) => buildThemeVariables(p.set.tokens, p.set.mapping).darkMode ?? false)).toEqual([
      false,
      false,
      false,
      true,
    ]);
  });
});

describe("describeTokens", () => {
  it("counts by type with plurals, leaving out empty types", () => {
    expect(describeTokens([{ type: "color" }])).toBe("1 colour");
    expect(describeTokens([{ type: "color" }, { type: "color" }, { type: "fontFamily" }])).toBe("2 colours, 1 font");
    expect(describeTokens([{ type: "dimension" }, { type: "dimension" }])).toBe("2 sizes");
    expect(describeTokens([])).toBe("No colours, fonts or sizes");
  });
});
