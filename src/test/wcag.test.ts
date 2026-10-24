import { describe, expect, it } from "vitest";
import { contrastRatio, formatRatio, higherContrast, parseHex, relativeLuminance, verdict } from "@/lib/contrast/wcag";

describe("parseHex", () => {
  it("reads six-digit and three-digit hex", () => {
    expect(parseHex("#1F6FEB")).toEqual([31, 111, 235]);
    expect(parseHex("#abc")).toEqual([170, 187, 204]);
  });

  it("rejects anything else", () => {
    expect(() => parseHex("1F6FEB")).toThrow();
    expect(() => parseHex("#1F6FEB80")).toThrow();
    expect(() => parseHex("rgb(0 0 0)")).toThrow();
  });
});

describe("relativeLuminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(relativeLuminance("#000")).toBe(0);
    expect(relativeLuminance("#FFF")).toBeCloseTo(1, 10);
  });
});

describe("contrastRatio", () => {
  it("matches the known pairs", () => {
    expect(contrastRatio("#000", "#FFF")).toBeCloseTo(21, 10);
    expect(contrastRatio("#777", "#FFF")).toBeCloseTo(4.48, 2);
  });

  it("does not depend on order", () => {
    expect(contrastRatio("#FFF", "#777")).toBe(contrastRatio("#777", "#FFF"));
  });

  it("is 1 for identical colours", () => {
    expect(contrastRatio("#2F5BD3", "#2F5BD3")).toBe(1);
  });

  // Figures quoted in design.md; if one of these fails, fix the manual too.
  it.each([
    ["#6B6B6B", "#FFFFFF", "5.3:1"],
    ["#6B6B6B", "#F4F4F4", "4.8:1"],
    ["#FFFFFF", "#D7261E", "5.0:1"],
    ["#FFFFFF", "#FF4B3E", "3.3:1"],
  ])("%s on %s is %s, as design.md states", (text, fill, expected) => {
    expect(formatRatio(contrastRatio(text, fill))).toBe(expected);
  });
});

describe("verdict", () => {
  it.each([
    [21, "aaa"],
    [7, "aaa"],
    [6.99, "aa"],
    [4.5, "aa"],
    [4.49, "large"],
    [3, "large"],
    [2.99, "fail"],
    [1, "fail"],
  ] as const)("%d:1 is %s", (ratio, expected) => {
    expect(verdict(ratio)).toBe(expected);
  });
});

describe("formatRatio", () => {
  it("shows one decimal in colon notation", () => {
    expect(formatRatio(21)).toBe("21.0:1");
    expect(formatRatio(4.8)).toBe("4.8:1");
  });

  it("truncates, so a shown 4.5:1 always passes AA", () => {
    expect(formatRatio(4.4999)).toBe("4.4:1");
    expect(formatRatio(contrastRatio("#777", "#FFF"))).toBe("4.4:1");
    expect(formatRatio(4.5)).toBe("4.5:1");
  });

  it("is not thrown off by floating-point error", () => {
    expect(formatRatio(contrastRatio("#000", "#FFF"))).toBe("21.0:1");
    // A plain floor would show this as 4.6:1.
    expect(4.6 + 0.1).toBe(4.699999999999999);
    expect(formatRatio(4.6 + 0.1)).toBe("4.7:1");
  });
});

describe("higherContrast", () => {
  it("picks the candidate that reads better on the fill", () => {
    expect(higherContrast("#2F5BD3", "#0B0B0B", "#FFFFFF")).toBe("#FFFFFF");
    expect(higherContrast("#E8B931", "#0B0B0B", "#FFFFFF")).toBe("#0B0B0B");
  });
});
