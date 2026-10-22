import { describe, expect, it } from "vitest";
import type { Mapping, Role, Token } from "@/lib/model";
import { automap, pathWords } from "@/lib/theme/automap";
import { parseCss } from "@/lib/tokens/parse-css";
import { parseDtcg } from "@/lib/tokens/parse-dtcg";
import { withIds, type TokenDraft } from "@/lib/tokens/result";

function tokens(entries: Array<[path: string, value: string, type?: Token["type"]]>): Token[] {
  return withIds(
    entries.map(([path, value, type = "color"]): TokenDraft => ({ path, value, type, source: "manual" })),
  );
}

/** Mapping as role → token path, for readable assertions. */
function byPath(set: readonly Token[], mapping: Mapping): Partial<Record<Role, string>> {
  return Object.fromEntries(
    Object.entries(mapping).map(([role, entry]) => [role, set.find((t) => t.id === entry?.tokenId)?.path]),
  );
}

describe("pathWords", () => {
  it("splits on punctuation and camelCase", () => {
    expect(pathWords("color.text.on-primary")).toEqual(["color", "text", "on", "primary"]);
    expect(pathWords("--color-bg-surface")).toEqual(["color", "bg", "surface"]);
    expect(pathWords("colors/onPrimary")).toEqual(["colors", "on", "primary"]);
    expect(pathWords("fontFamily.body")).toEqual(["font", "family", "body"]);
  });
});

describe("automap", () => {
  it("maps a typical semantic token set", () => {
    const set = tokens([
      ["color.brand.primary", "#2F5BD3"],
      ["color.brand.primary-hover", "#2449B0"],
      ["color.brand.secondary", "#E8B931"],
      ["color.brand.tertiary", "#3F8F6A"],
      ["color.text.default", "#121212"],
      ["color.text.on-primary", "#FFFFFF"],
      ["color.text.muted", "#6B6B6B"],
      ["color.border.default", "#3B3B3B"],
      ["color.line", "#121212"],
      ["color.bg.default", "#FBFAF6"],
      ["color.bg.raised", "#FFFFFF"],
      ["color.note.bg", "#F3E3B3"],
      ["color.note.text", "#3B3B3B"],
      ["font.family.heading", "Georgia, serif", "fontFamily"],
      ["font.family.body", "Inter, sans-serif", "fontFamily"],
      ["font.size.sm", "13px", "dimension"],
      ["font.size.base", "15px", "dimension"],
    ]);
    const mapping = automap(set);
    expect(byPath(set, mapping)).toEqual({
      primaryColor: "color.brand.primary",
      primaryTextColor: "color.text.on-primary",
      primaryBorderColor: "color.border.default",
      secondaryColor: "color.brand.secondary",
      tertiaryColor: "color.brand.tertiary",
      lineColor: "color.line",
      background: "color.bg.default",
      noteBkgColor: "color.note.bg",
      noteTextColor: "color.note.text",
      fontFamily: "font.family.body",
      fontSize: "font.size.base",
    });
    expect(Object.values(mapping).every((entry) => entry?.auto)).toBe(true);
    // Panel order, so the mapping serialises the same way every time.
    expect(Object.keys(mapping)[0]).toBe("primaryColor");
  });

  it("prefers the text colour that reads on the chosen primary fill", () => {
    const set = tokens([
      ["primary", "#1D3F8F"],
      ["text.dark", "#121212"],
      ["text.light", "#FFFFFF"],
    ]);
    expect(byPath(set, automap(set)).primaryTextColor).toBe("text.light");
  });

  it("picks the middle of a scale for fills and the light end for backgrounds", () => {
    const set = tokens([
      ["primary.50", "#EEF2FC"],
      ["primary.500", "#2F5BD3"],
      ["primary.900", "#0F1E46"],
      ["surface.900", "#111111"],
      ["surface.50", "#FAFAFA"],
    ]);
    const mapped = byPath(set, automap(set));
    expect(mapped.primaryColor).toBe("primary.500");
    expect(mapped.background).toBe("surface.50");
  });

  it("never maps a text token to a fill or the fill to its own text", () => {
    const set = tokens([["color.primary", "#2F5BD3"]]);
    expect(byPath(set, automap(set))).toEqual({ primaryColor: "color.primary" });
  });

  it("leaves roles unmapped when no name matches", () => {
    const set = tokens([
      ["blue.500", "#2F5BD3"],
      ["grey.100", "#F4F4F4"],
    ]);
    expect(automap(set)).toEqual({});
  });

  it("keeps confirmed choices and replaces earlier guesses", () => {
    const set = tokens([
      ["color.primary", "#2F5BD3"],
      ["color.brand", "#E8B931"],
      ["color.bg", "#FFFFFF"],
    ]);
    const current: Mapping = {
      primaryColor: { tokenId: set[1].id, auto: false },
      background: { tokenId: set[0].id, auto: true },
      lineColor: { tokenId: "deleted", auto: false },
    };
    const mapping = automap(set, current);
    expect(mapping.primaryColor).toEqual({ tokenId: set[1].id, auto: false });
    expect(mapping.background).toEqual({ tokenId: set[2].id, auto: true });
    expect(mapping.lineColor).toBeUndefined();
  });

  it("maps parsed CSS and DTCG files end to end", () => {
    const css = parseCss(`:root {
      --color-primary: #2F5BD3;
      --color-on-primary: #FFFFFF;
      --color-background: #FBFAF6;
      --color-border: #3B3B3B;
      --font-sans: Inter, sans-serif;
      --text-base: 1rem;
    }`);
    if (!css.ok) throw new Error(css.error.message);
    expect(byPath(css.tokens, automap(css.tokens))).toEqual({
      primaryColor: "--color-primary",
      primaryTextColor: "--color-on-primary",
      primaryBorderColor: "--color-border",
      lineColor: "--color-border",
      background: "--color-background",
      fontFamily: "--font-sans",
      fontSize: "--text-base",
    });

    const dtcg = parseDtcg(
      JSON.stringify({ color: { $type: "color", accent: { $value: "#2F5BD3" }, surface: { $value: "#FFFFFF" } } }),
    );
    if (!dtcg.ok) throw new Error(dtcg.error.message);
    expect(byPath(dtcg.tokens, automap(dtcg.tokens))).toEqual({ primaryColor: "color.accent", background: "color.surface" });
  });
});
