import { expect, it } from "vitest";
import { DIAGRAMS } from "@/lib/theme/diagrams";
import { SAMPLES } from "@/lib/mermaid/samples";
import { validateSource } from "@/lib/mermaid/source";
import { buildThemeVariables } from "@/lib/theme/build-theme";
import { exportConfig } from "@/lib/theme/export";
import { PRESETS } from "@/lib/tokens/presets";
import { pairsFor } from "@/lib/theme/roles";

it("adds Pie as diagram 7 with representative percentage checks", () => {
  expect(DIAGRAMS).toContainEqual({ kind: "pie", index: 7, name: "Pie" });
  expect(validateSource("pie", SAMPLES.pie)).toBeNull();
  expect(validateSource("pie", 'pie showData\n"Tokens" : 40')).toBeNull();
  expect(validateSource("pie", "flowchart LR\nA-->B")).toMatch(/pie/);
  const checks = pairsFor("pie");
  expect(checks.filter(p => p.backgroundOpacity === 0.7)).toHaveLength(3);
  expect(checks.map(p => p.foreground)).toEqual(expect.arrayContaining(["pieSectionTextColor", "pieTitleTextColor", "pieLegendTextColor"]));
});

it("exports the mapped fill palette in all twelve Pie slots", () => {
  const set = PRESETS[0].set;
  const variables = exportConfig(set).themeVariables;
  const fills = [variables.primaryColor, variables.secondaryColor, variables.tertiaryColor];
  for (let i = 1; i <= 12; i++) expect(variables[`pie${i}`]).toBe(fills[(i - 1) % 3]);
  expect(variables.pieSectionTextColor).toBe(variables.primaryTextColor);
  expect(variables.pieTitleTextColor).toBe(variables.primaryTextColor);
  expect(variables.pieLegendTextColor).toBe(variables.primaryTextColor);
  expect(variables.pieStrokeColor).toBe(variables.primaryBorderColor);
});

it("leaves missing roles derived and builds Pie colours from available mapped fills", () => {
  expect(buildThemeVariables([], {})).toEqual({});
  const variables = buildThemeVariables([{ id: "fill", path: "fill", type: "color", value: "#102030", alpha: 0.5, source: "manual" }], { secondaryColor: { tokenId: "fill", auto: false } }, { backdrop: "#FFFFFF" });
  expect(variables).not.toHaveProperty("primaryColor");
  expect(variables).not.toHaveProperty("pieSectionTextColor");
  for (let i = 1; i <= 12; i++) expect(variables[`pie${i}`]).toBe("#889098");
});

it("adds Timeline as diagram 8 and exports scale fills/labels without an event colour filter", () => {
  expect(DIAGRAMS).toContainEqual({ kind: "timeline", index: 8, name: "Timeline" });
  expect(validateSource("timeline", SAMPLES.timeline)).toBeNull();
  expect(validateSource("timeline", "timeline\n2026 : Build")).toBeNull();
  expect(validateSource("timeline", "pie\n\"Build\" : 1")).toMatch(/timeline/);
  const config = exportConfig(PRESETS[0].set);
  const fills = [config.themeVariables.primaryColor, config.themeVariables.secondaryColor, config.themeVariables.tertiaryColor];
  for (let i = 0; i < 12; i++) {
    expect(config.themeVariables[`cScale${i}`]).toBe(fills[i % 3]);
    expect(config.themeVariables[`cScaleLabel${i}`]).toBe(config.themeVariables.primaryTextColor);
  }
  expect(config.themeCSS).toContain(".eventWrapper");
  expect(config.themeCSS).toContain("filter: none");
  expect(pairsFor("timeline").map(p => p.background)).toEqual(expect.arrayContaining(["cScale0", "cScale1", "cScale2"]));
});
