import { describe, expect, it } from "vitest";
import {
  composite,
  formatAlpha,
  normaliseCssColour,
  normaliseDtcgColour,
} from "@/lib/tokens/colour";

describe("normaliseCssColour", () => {
  it("normalises hex of every length to uppercase #RRGGBB", () => {
    expect(normaliseCssColour("#1f6feb")).toEqual({ hex: "#1F6FEB", mapped: false });
    expect(normaliseCssColour("#abc")).toEqual({ hex: "#AABBCC", mapped: false });
    expect(normaliseCssColour("  #1F6FEB  ")).toEqual({ hex: "#1F6FEB", mapped: false });
  });

  it("keeps alpha separately, and drops it when opaque", () => {
    expect(normaliseCssColour("#1F6FEB80")).toEqual({ hex: "#1F6FEB", alpha: 0.502, mapped: false });
    expect(normaliseCssColour("#abcd")).toEqual({ hex: "#AABBCC", alpha: 0.867, mapped: false });
    expect(normaliseCssColour("#1F6FEBFF")).toEqual({ hex: "#1F6FEB", mapped: false });
    expect(normaliseCssColour("transparent")).toEqual({ hex: "#000000", alpha: 0, mapped: false });
  });

  it("reads colour functions and names", () => {
    expect(normaliseCssColour("rgb(31 111 235)")?.hex).toBe("#1F6FEB");
    expect(normaliseCssColour("rgba(31, 111, 235, 0.5)")).toEqual({
      hex: "#1F6FEB",
      alpha: 0.5,
      mapped: false,
    });
    expect(normaliseCssColour("hsl(0 100% 50%)")?.hex).toBe("#FF0000");
    expect(normaliseCssColour("rebeccapurple")?.hex).toBe("#663399");
    expect(normaliseCssColour("oklch(1 0 0)")).toEqual({ hex: "#FFFFFF", mapped: false });
    expect(normaliseCssColour("color(display-p3 1 1 1)")).toEqual({ hex: "#FFFFFF", mapped: false });
  });

  it("maps colours outside sRGB into it and says so", () => {
    const vivid = normaliseCssColour("color(display-p3 1 0 0)");
    expect(vivid?.mapped).toBe(true);
    expect(vivid?.hex).toMatch(/^#[0-9A-F]{6}$/);
    // Gamut mapping keeps the hue: still clearly red.
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(vivid!.hex.slice(i, i + 2), 16));
    expect(r).toBeGreaterThan(200);
    expect(g).toBeLessThan(80);
    expect(b).toBeLessThan(80);
  });

  it("returns null for anything that isn't a colour", () => {
    for (const input of ["", "nonsense", "currentColor", "var(--x)", "16px", "#12", "rgb(1 2)", "700", "fade", "123456"]) {
      expect(normaliseCssColour(input), input).toBeNull();
    }
  });
});

describe("normaliseDtcgColour", () => {
  it("converts sRGB components", () => {
    expect(normaliseDtcgColour("srgb", [0.1216, 0.4353, 0.9216])).toEqual({
      hex: "#1F6FEB",
      mapped: false,
    });
  });

  it("reads HSL and HWB percentages as 0–100", () => {
    expect(normaliseDtcgColour("hsl", [0, 100, 50])?.hex).toBe("#FF0000");
    expect(normaliseDtcgColour("hwb", [120, 0, 0])?.hex).toBe("#00FF00");
  });

  it("treats 'none' as a missing channel", () => {
    expect(normaliseDtcgColour("oklch", [1, 0, "none"])?.hex).toBe("#FFFFFF");
  });

  it("keeps alpha and flags gamut mapping", () => {
    expect(normaliseDtcgColour("srgb", [1, 1, 1], 0.25)).toEqual({ hex: "#FFFFFF", alpha: 0.25, mapped: false });
    expect(normaliseDtcgColour("display-p3", [0, 1, 0])?.mapped).toBe(true);
  });
});

describe("composite", () => {
  it("blends over the backdrop in sRGB", () => {
    expect(composite("#000000", 0.5, "#FFFFFF")).toBe("#808080");
    expect(composite("#1F6FEB", 1, "#FFFFFF")).toBe("#1F6FEB");
    expect(composite("#1F6FEB", 0, "#0B0B0B")).toBe("#0B0B0B");
  });
});

describe("formatAlpha", () => {
  it("shows a whole percentage", () => {
    expect(formatAlpha(0.502)).toBe("50%");
    expect(formatAlpha(0.867)).toBe("87%");
  });
});
