import { describe, expect, it } from "vitest";
import {
  checkPair,
  checkPairs,
  checksFor,
  contrastMessage,
  outcomeOf,
  summarise,
  worstCheck,
  type ColourLookup,
} from "@/lib/contrast/check";
import { CONTRAST_PAIRS, type ContrastPair, type ThemeVariable } from "@/lib/theme/roles";

function pair(id: string): ContrastPair {
  const found = CONTRAST_PAIRS.find((p) => p.id === id);
  if (!found) throw new Error(id);
  return found;
}

function lookup(values: Partial<Record<ThemeVariable, string>>): ColourLookup {
  return (variable) => values[variable];
}

describe("outcomeOf", () => {
  it("holds text to 4.5:1, with 3:1 as large-only", () => {
    const text = { kind: "text" } as const;
    expect(outcomeOf(text, 4.5)).toBe("pass");
    expect(outcomeOf(text, 4.49)).toBe("large");
    expect(outcomeOf(text, 3)).toBe("large");
    expect(outcomeOf(text, 2.99)).toBe("fail");
  });

  it("holds lines and outlines to 3:1, with no large-only band", () => {
    const line = { kind: "non-text" } as const;
    expect(outcomeOf(line, 3)).toBe("pass");
    expect(outcomeOf(line, 2.99)).toBe("fail");
  });
});

describe("checkPair", () => {
  it("compares the pair's two variables", () => {
    const check = checkPair(pair("primary-text"), lookup({ nodeTextColor: "#FFFFFF", mainBkg: "#000000" }), "#FFFFFF");
    expect(check).toMatchObject({ foreground: "#FFFFFF", background: "#000000", verdict: "aaa", outcome: "pass" });
    expect(check?.ratio).toBeCloseTo(21, 5);
  });

  it("uses the preview surface for background pairs", () => {
    const line = pair("line-on-background");
    const grey = lookup({ lineColor: "#777777" });
    expect(checkPair(line, grey, "#FFFFFF")?.outcome).toBe("pass");
    expect(checkPair(line, grey, "#0B0B0B")?.outcome).toBe("pass");
    expect(checkPair(line, lookup({ lineColor: "#D6D6D6" }), "#FFFFFF")?.outcome).toBe("fail");
  });

  it("reads any CSS colour Mermaid derives, and composites alpha", () => {
    const check = checkPair(
      pair("note-text"),
      lookup({ noteTextColor: "rgba(0, 0, 0, 0.5)", noteBkgColor: "hsl(0, 0%, 100%)" }),
      "#0B0B0B",
    );
    // Half-black over white is #808080: 3.9:1, large text only.
    expect(check).toMatchObject({ foreground: "#808080", background: "#FFFFFF", outcome: "large" });

    const overSurface = checkPair(
      pair("primary-text"),
      lookup({ nodeTextColor: "#FFFFFF", mainBkg: "#FFFFFF00" }),
      "#0B0B0B",
    );
    // A transparent fill shows the surface through it.
    expect(overSurface?.background).toBe("#0B0B0B");
  });

  it("skips pairs it can't read", () => {
    expect(checkPair(pair("primary-text"), lookup({ nodeTextColor: "#FFFFFF" }), "#FFFFFF")).toBeNull();
    expect(checkPair(pair("primary-text"), lookup({ nodeTextColor: "nope", mainBkg: "#FFF" }), "#FFFFFF")).toBeNull();
  });

  it("checks the ER attribute fills and composites the Gantt section behind text", () => {
    const checks = checkPairs(lookup({ nodeTextColor: "#FFFFFF", rowOdd: "#BFBFBF", rowEven: "#0D0D0D", textColor: "#FFFFFF", sectionBkgColor: "#000000" }), "#FFFFFF");
    expect(checks.find((check) => check.pair.id === "attribute-odd")?.outcome).toBe("fail");
    expect(checks.find((check) => check.pair.id === "attribute-even")?.outcome).toBe("pass");
    expect(checks.find((check) => check.pair.id === "section-text")?.background).toBe("#CCCCCC");
  });
});

describe("summaries and messages", () => {
  const values = lookup({
    nodeTextColor: "#FFFFFF",
    mainBkg: "#E8B931", // white on yellow: 1.8:1, fails
    textColor: "#FFFFFF",
    edgeLabelBackground: "#2F5BD3", // 5.6:1, passes
    noteTextColor: "#3B3B3B",
    noteBkgColor: "#F3E3B3", // 9.4:1
    lineColor: "#8A8A8A", // on #FBFAF6: 3.3:1, passes as non-text
    actorLineColor: "#121212",
  });
  const checks = checkPairs(values, "#FBFAF6");

  it("checks every readable pair", () => {
    expect(checks.map((c) => c.pair.id)).toEqual([
      "primary-text",
      "label-text",
      "note-text",
      "text-on-background",
      "line-on-background",
      "lifeline-on-background",
    ]);
  });

  it("summarises with the worst outcome first", () => {
    expect(summarise(checks)).toEqual({ pairs: 6, pass: 4, large: 0, fail: 2, worst: "fail" });
    expect(summarise(checksFor("er", checks))).toEqual({ pairs: 3, pass: 2, large: 0, fail: 1, worst: "fail" });
    expect(summarise([])).toEqual({ pairs: 0, pass: 0, large: 0, fail: 0, worst: null });
  });

  it("ranks failed text above lower-ratio non-text that passes its threshold", () => {
    const text = checkPair(pair("primary-text"), lookup({ nodeTextColor: "#777777", mainBkg: "#FFFFFF" }), "#FFFFFF")!;
    const line = checkPair(pair("line-on-background"), lookup({ lineColor: "#888888" }), "#FFFFFF")!;
    expect(text.outcome).toBe("large");
    expect(line.outcome).toBe("pass");
    expect(line.ratio).toBeLessThan(text.ratio);
    expect(worstCheck([line, text])).toBe(text);
  });

  it("writes messages like a sign", () => {
    const byId = (id: string) => checks.find((c) => c.pair.id === id)!;
    expect(contrastMessage(byId("primary-text"))).toBe("Text on primary fails: 1.8:1. Needs 4.5:1.");
    expect(contrastMessage(byId("note-text"))).toBeNull();
    const large = checkPair(pair("note-text"), lookup({ noteTextColor: "#808080", noteBkgColor: "#FFFFFF" }), "#FFFFFF")!;
    expect(contrastMessage(large)).toBe("Note text passes for large text only: 3.9:1. Needs 4.5:1.");
    const line = checkPair(pair("line-on-background"), lookup({ lineColor: "#D6D6D6" }), "#FFFFFF")!;
    expect(contrastMessage(line)).toBe("Line on background fails: 1.4:1. Needs 3.0:1.");
  });
});
