import { expect, it } from "vitest";
import { DIAGRAMS } from "@/lib/theme/diagrams";
import { SAMPLES } from "@/lib/mermaid/samples";
import { validateSource } from "@/lib/mermaid/source";
import { pairsFor } from "@/lib/theme/roles";
import { createBatchRenderer } from "@/lib/mermaid/batch";

it("adds State as diagram 5 with a themed, editable state-machine sample", () => {
  expect(DIAGRAMS).toContainEqual({ kind: "state", index: 5, name: "State" });
  expect(SAMPLES.state).toMatch(/^stateDiagram-v2/);
  expect(validateSource("state", SAMPLES.state)).toBeNull();
  expect(validateSource("state", "stateDiagram-v2\n Idle --> Ready")).toBeNull();
  expect(validateSource("state", "flowchart LR\nA-->B")).toMatch(/stateDiagram-v2/);
  expect(pairsFor("state").map((pair) => pair.id)).toEqual(expect.arrayContaining(["state-text", "state-transition", "state-line", "note-text"]));
});

it("renders only requested diagram kinds for the compact landing proof", async () => {
  const rendered: string[] = [];
  const render = createBatchRenderer({ initialize() {}, getThemeVariables: () => ({}), async render(_id, source) { rendered.push(source); return { svg: "<svg/>" }; } });
  const result = await render({}, SAMPLES, undefined, ["flowchart"]);
  expect(rendered).toEqual([SAMPLES.flowchart]);
  expect(Object.keys(result!.diagrams)).toEqual(["flowchart"]);
});

it("does not allow state styling to override the mapped theme", () => {
  for (const statement of ["classDef active fill:red", "class Idle active", "Idle:::active", "cssClass Idle active"]) {
    expect(validateSource("state", `stateDiagram-v2\n Idle --> Ready\n ${statement}`)).toMatch(/tokens|styles/);
  }
  for (const source of ["stateDiagram-v2 style Idle fill:red\nIdle --> Ready", "stateDiagram-v2 classDef default fill:red\nIdle --> Ready", "stateDiagram-v2\nstate Composite { style Idle fill:red\nIdle --> Ready\n}", "stateDiagram-v2\nIdle --> Ready style Ready fill:red", "stateDiagram-v2\nIdle --> Ready classDef default fill:red"]) expect(validateSource("state", source), source).not.toBeNull();
});

it("allows style-related words inside state labels and notes", () => {
  expect(validateSource("state", 'stateDiagram-v2\nstate "Choose a style" as Draft\nDraft --> Ready: Apply style\nnote right of Ready\nstyle and class choices\nend note')).toBeNull();
});

it("checks state statements following a semicolon-terminated label", () => {
  expect(validateSource("state", "stateDiagram-v2\nIdle --> Ready: Next; style Ready fill:red")).not.toBeNull();
});

it("adds Class as diagram 6 while protecting genuine class declarations", () => {
  expect(DIAGRAMS).toContainEqual({ kind: "class", index: 6, name: "Class" });
  expect(validateSource("class", SAMPLES.class)).toBeNull();
  expect(validateSource("class", "classDiagram\nclass Token {\n +String value\n}")).toBeNull();
  for (const command of ['class Token:::custom { +String value }', 'class Token:::custom', 'link Token "https://example.com"', "callback Token run()", "cssClass Token selected", "classDef default fill:red", "style Token fill:red"]) {
    expect(validateSource("class", `classDiagram ${command}\nclass Token`), command).not.toBeNull();
  }
  expect(pairsFor("class").map((pair) => pair.id)).toEqual(expect.arrayContaining(["class-text", "class-label", "line-on-background"]));
});
