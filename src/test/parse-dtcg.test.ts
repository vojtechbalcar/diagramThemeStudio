import { describe, expect, it } from "vitest";
import { TokenSchema } from "@/lib/model";
import { looksLikeFontSize, parseDtcg, readDtcg } from "@/lib/tokens/parse-dtcg";
import { tokenId, type ParseResult } from "@/lib/tokens/result";

function ok(result: ParseResult) {
  if (!result.ok) throw new Error(result.error.message);
  return result;
}

/** Tokens as path → value (with alpha), for compact assertions. */
function values(result: ParseResult) {
  return Object.fromEntries(
    ok(result).tokens.map((t) => [t.path, t.alpha === undefined ? t.value : `${t.value} ${t.alpha}`]),
  );
}

const json = (value: unknown) => JSON.stringify(value, null, 2);

describe("parseDtcg — 2025.10 format", () => {
  it("reads structured colours, dimensions and font families", () => {
    const result = parseDtcg(
      json({
        color: {
          $type: "color",
          brand: { $value: { colorSpace: "srgb", components: [0.1216, 0.4353, 0.9216] } },
          overlay: { $value: { colorSpace: "srgb", components: [0, 0, 0], alpha: 0.5 } },
          wide: { $value: { colorSpace: "display-p3", components: [1, 0, 0], hex: "#ff2a1f" } },
          leaf: { $value: { colorSpace: "oklch", components: [0.6, 0.12, 145] } },
        },
        font: {
          family: { body: { $type: "fontFamily", $value: ["Helvetica Neue", "Arial", "sans-serif"] } },
          size: { body: { $type: "dimension", $value: { value: 15, unit: "px" } } },
        },
      }),
    );
    expect(values(result)).toEqual({
      "color.brand": "#1F6FEB",
      "color.overlay": "#000000 0.5",
      "color.wide": "#FF2A1F",
      "color.leaf": expect.stringMatching(/^#[0-9A-F]{6}$/),
      "font.family.body": '"Helvetica Neue", Arial, sans-serif',
      "font.size.body": "15px",
    });
    expect(ok(result).warnings).toEqual([]);
  });

  it("produces tokens that satisfy the domain schema, with ids from the path", () => {
    const result = ok(parseDtcg(json({ color: { primary: { $type: "color", $value: "#1f6feb" } } })));
    expect(result.tokens).toEqual([
      { id: tokenId("color.primary"), path: "color.primary", type: "color", value: "#1F6FEB", source: "dtcg" },
    ]);
    for (const token of result.tokens) expect(TokenSchema.safeParse(token).success).toBe(true);
  });

  it("inherits $type from the nearest group", () => {
    const result = parseDtcg(
      json({ palette: { $type: "color", blue: { "500": { $value: "#2F5BD3" } }, ink: { $value: "#121212" } } }),
    );
    expect(values(result)).toEqual({ "palette.blue.500": "#2F5BD3", "palette.ink": "#121212" });
  });

  it("resolves curly-brace references and JSON pointer $refs, through chains", () => {
    const result = parseDtcg(
      json({
        base: { $type: "color", blue: { $value: "#2F5BD3" } },
        semantic: {
          primary: { $value: "{base.blue}" },
          action: { $value: "{semantic.primary}" },
          link: { $value: { $ref: "#/base/blue/$value" } },
          button: { $value: { $ref: "#/base/blue" } },
        },
      }),
    );
    expect(values(result)).toEqual({
      "base.blue": "#2F5BD3",
      "semantic.primary": "#2F5BD3",
      "semantic.action": "#2F5BD3",
      "semantic.link": "#2F5BD3",
      "semantic.button": "#2F5BD3",
    });
  });

  it("takes an alias's type from its target before its group", () => {
    const result = parseDtcg(
      json({
        base: { $type: "color", blue: { $value: "#2F5BD3" } },
        // The group says dimension, but the token points at a colour.
        sizes: { $type: "dimension", text: { $value: "{base.blue}" } },
      }),
    );
    expect(values(result)).toEqual({ "base.blue": "#2F5BD3", "sizes.text": "#2F5BD3" });
  });

  it("warns about broken and looping references instead of failing", () => {
    const result = ok(
      parseDtcg(
        json({
          color: {
            $type: "color",
            a: { $value: "{color.b}" },
            b: { $value: "{color.a}" },
            c: { $value: "{color.missing}" },
            d: { $value: { $ref: "#/color/e/$value/components/0" } },
            e: { $value: "#FFFFFF" },
          },
        }),
      ),
    );
    expect(result.tokens.map((t) => t.path)).toEqual(["color.e"]);
    expect(result.warnings).toEqual([
      { path: "color.a", message: "Its reference loops back to itself. Point it at a token with a value." },
      { path: "color.b", message: "Its reference loops back to itself. Point it at a token with a value." },
      {
        path: "color.c",
        message: "Refers to {color.missing}, which isn't in the file. Add that token or fix the reference.",
      },
      {
        path: "color.d",
        message: "Linework can't read references into part of a value. Reference the whole token instead.",
      },
    ]);
  });

  it("supports $root tokens and $extends", () => {
    const result = parseDtcg(
      json({
        accent: { $type: "color", $root: { $value: "#2F5BD3" }, light: { $value: "#DCE5FA" } },
        button: { $type: "color", fill: { $value: "#121212" }, text: { $value: "#FFFFFF" } },
        danger: { $extends: "{button}", fill: { $value: "#D7261E" } },
      }),
    );
    expect(values(result)).toEqual({
      "accent.$root": "#2F5BD3",
      "accent.light": "#DCE5FA",
      "button.fill": "#121212",
      "button.text": "#FFFFFF",
      "danger.fill": "#D7261E",
      "danger.text": "#FFFFFF",
    });
  });

  it("stops $extends loops", () => {
    const result = ok(
      parseDtcg(
        json({
          a: { $type: "color", $extends: "{b}", x: { $value: "#000000" } },
          b: { $type: "color", $extends: "{a}", y: { $value: "#FFFFFF" } },
        }),
      ),
    );
    expect(result.warnings.map((w) => w.message)).toContain("Its $extends loops back to itself. Remove one of them.");
    expect(result.tokens.map((t) => t.path)).toEqual(expect.arrayContaining(["a.x", "b.y"]));
  });

  it("skips token types Linework doesn't use, and spacing dimensions, silently", () => {
    const result = ok(
      parseDtcg(
        json({
          spacing: { $type: "dimension", "4": { $value: { value: 16, unit: "px" } } },
          radius: { sm: { $type: "dimension", $value: "4px" } },
          shadow: { card: { $type: "shadow", $value: { color: "#000000", offsetX: "0px" } } },
          duration: { fast: { $type: "duration", $value: { value: 100, unit: "ms" } } },
          font: { size: { body: { $type: "dimension", $value: "1rem" } } },
        }),
      ),
    );
    expect(values(result)).toEqual({ "font.size.body": "1rem" });
    expect(result.skipped).toBe(4);
    expect(result.warnings).toEqual([]);
  });

  it("warns about colours it can't read", () => {
    const result = ok(
      parseDtcg(
        json({
          c: {
            $type: "color",
            bad: { $value: "#12" },
            space: { $value: { colorSpace: "cmyk", components: [0, 0, 0] } },
            parts: { $value: { colorSpace: "srgb", components: ["{c.x}", 0, 0] } },
          },
        }),
      ),
    );
    expect(result.warnings.map((w) => w.message)).toEqual([
      '"#12" isn\'t a colour Linework can read. Use hex, rgb() or oklch().',
      'Colour space "cmyk" isn\'t supported. Use srgb, display-p3 or oklch.',
      "Linework can't read references inside a colour's components. Reference the whole colour instead.",
    ]);
  });

  it("says when a colour had to be moved into sRGB", () => {
    const result = ok(
      parseDtcg(json({ c: { $type: "color", vivid: { $value: { colorSpace: "display-p3", components: [0, 1, 0] } } } })),
    );
    expect(result.tokens).toHaveLength(1);
    expect(result.warnings[0].message).toMatch(/^Outside sRGB, so Linework uses the nearest colour it can show, #[0-9A-F]{6}\.$/);
  });
});

describe("parseDtcg — legacy and tool formats", () => {
  it("reads string values without $type when they are unambiguous", () => {
    const result = parseDtcg(
      json({
        color: { primary: { $value: "#2F5BD3" }, muted: { $value: "rgb(0 0 0 / 50%)" } },
        word: { $value: "bold" },
        "font-size": { base: { $value: "16px" } },
      }),
    );
    expect(values(result)).toEqual({
      "color.primary": "#2F5BD3",
      "color.muted": "#000000 0.5",
      "font-size.base": "16px",
    });
  });

  it("reads Style Dictionary / Tokens Studio files that use value and type without $", () => {
    const result = parseDtcg(
      json({
        global: {
          colors: { primary: { value: "#2f5bd3", type: "color" }, text: { value: "{global.colors.ink}", type: "color" } },
          ink: { value: "#121212", type: "color" },
          fontFamilies: { body: { value: "Inter, sans-serif", type: "fontFamilies" } },
          fontSizes: { body: { value: "16", type: "fontSizes" } },
          spacing: { sm: { value: "8", type: "spacing" } },
        },
        $themes: [],
        $metadata: { tokenSetOrder: ["global"] },
      }),
    );
    // Tokens Studio alias: global.colors.text points at a token that doesn't exist.
    expect(values(result)).toEqual({
      "global.colors.primary": "#2F5BD3",
      "global.ink": "#121212",
      "global.fontFamilies.body": "Inter, sans-serif",
      "global.fontSizes.body": "16px",
    });
    expect(ok(result).warnings).toHaveLength(1);
  });

  it("uses Figma scopes to recognise font sizes and families", () => {
    const result = readDtcg(
      {
        size: { $type: "number", $value: 14, $extensions: { "com.figma.scopes": ["FONT_SIZE"] } },
        gap: { $type: "number", $value: 8, $extensions: { "com.figma.scopes": ["GAP"] } },
        family: { $type: "string", $value: "Inter", $extensions: { "com.figma": { scopes: ["FONT_FAMILY"] } } },
      },
      "figma",
    );
    expect(ok(result).tokens.map((t) => [t.path, t.type, t.value, t.source])).toEqual([
      ["size", "dimension", "14px", "figma"],
      ["family", "fontFamily", "Inter", "figma"],
    ]);
  });
});

describe("parseDtcg — failures", () => {
  it("passes JSON errors through with their line", () => {
    expect(parseDtcg('{\n  "a": { "$value": "#FFF" }\n  "b": 1\n}')).toEqual({
      ok: false,
      error: { message: "Line 2 is not valid JSON. Check for a missing comma.", line: 2 },
    });
  });

  it("rejects JSON that isn't an object", () => {
    expect(parseDtcg("[1, 2]")).toEqual({
      ok: false,
      error: { message: "This isn't a token file. Its top level must be an object of groups and tokens." },
    });
  });

  it("returns no tokens, not an error, for an object without any", () => {
    expect(parseDtcg('{"name": "linework"}')).toEqual({ ok: true, tokens: [], warnings: [], skipped: 0 });
  });
});

describe("looksLikeFontSize", () => {
  it("accepts font-size names and rejects other dimensions", () => {
    for (const path of ["font.size.body", "--text-base", "typography.caption.size", "fontSize.lg"]) {
      expect(looksLikeFontSize(path), path).toBe(true);
    }
    for (const path of ["spacing.4", "font.line-height", "text.letter-spacing", "radius.sm", "size.icon"]) {
      expect(looksLikeFontSize(path), path).toBe(false);
    }
  });
});
