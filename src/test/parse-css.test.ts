import { describe, expect, it } from "vitest";
import { TokenSchema } from "@/lib/model";
import { parseCss } from "@/lib/tokens/parse-css";
import type { ParseResult } from "@/lib/tokens/result";

function ok(result: ParseResult) {
  if (!result.ok) throw new Error(result.error.message);
  return result;
}

function values(result: ParseResult) {
  return Object.fromEntries(
    ok(result).tokens.map((t) => [t.path, t.alpha === undefined ? t.value : `${t.value} ${t.alpha}`]),
  );
}

describe("parseCss", () => {
  it("reads custom properties from a stylesheet and skips everything else", () => {
    const css = `
      /* Brand tokens */
      :root {
        --color-brand-primary: #2f5bd3;
        --color-ink: rgb(18 18 18);
        --color-overlay: rgb(0 0 0 / 0.4);
        --font-sans: "Helvetica Neue", Arial, sans-serif;
        --font-size-base: 16px;
        --spacing-4: 16px;
        --radius: 4px;
        --ease: cubic-bezier(0.2, 0, 0, 1);
        color: var(--color-ink);
      }
      body { margin: 0; font-family: var(--font-sans); }
    `;
    const result = ok(parseCss(css));
    expect(values(result)).toEqual({
      "--color-brand-primary": "#2F5BD3",
      "--color-ink": "#121212",
      "--color-overlay": "#000000 0.4",
      "--font-sans": '"Helvetica Neue", Arial, sans-serif',
      "--font-size-base": "16px",
    });
    expect(result.skipped).toBe(3);
    expect(result.warnings).toEqual([]);
    expect(result.tokens.map((t) => t.type)).toEqual(["color", "color", "color", "fontFamily", "dimension"]);
    for (const token of result.tokens) {
      expect(token.source).toBe("css");
      expect(TokenSchema.safeParse(token).success).toBe(true);
    }
  });

  it("accepts bare pasted lines, with or without semicolons", () => {
    expect(values(parseCss("--a: #FFF;\n--b: #000;"))).toEqual({ "--a": "#FFFFFF", "--b": "#000000" });
    expect(values(parseCss("--a: #FFF\n--b: oklch(0 0 0)\n"))).toEqual({ "--a": "#FFFFFF", "--b": "#000000" });
  });

  it("resolves var() references, fallbacks and chains", () => {
    const css = `
      :root {
        --blue-500: #2F5BD3;
        --primary: var(--blue-500);
        --button: var(--primary);
        --accent: var(--not-here, #E8B931);
        --channels: 47 91 211;
        --built: rgb(var(--channels));
      }`;
    expect(values(parseCss(css))).toEqual({
      "--blue-500": "#2F5BD3",
      "--primary": "#2F5BD3",
      "--button": "#2F5BD3",
      "--accent": "#E8B931",
      "--built": "#2F5BD3",
    });
  });

  it("takes the light value of light-dark()", () => {
    expect(values(parseCss(":root { --page: light-dark(#FFFFFF, #0B0B0B); }"))).toEqual({ "--page": "#FFFFFF" });
    expect(values(parseCss("--a: #111; --page: light-dark(var(--a), white);"))).toEqual({
      "--a": "#111111",
      "--page": "#111111",
    });
  });

  it("keeps the first of repeated declarations and says so once", () => {
    const css = `
      :root { --bg: #FFFFFF; --text: #0B0B0B; --line: #6B6B6B; }
      @media (prefers-color-scheme: dark) {
        :root { --bg: #0B0B0B; --text: #FFFFFF; --line: #6B6B6B; }
      }`;
    const result = ok(parseCss(css));
    expect(values(result)).toEqual({ "--bg": "#FFFFFF", "--text": "#0B0B0B", "--line": "#6B6B6B" });
    expect(result.warnings).toEqual([
      {
        path: "--bg",
        message:
          "This and 1 other property are declared more than once with different values. Linework uses the first value of each.",
      },
    ]);
  });

  it("strips !important and ignores properties inside strings and comments", () => {
    const css = `:root {
      --a: #FFFFFF !important;
      /* --b: #000000; */
      --c: "--d: red";
    }`;
    const result = ok(parseCss(css));
    expect(values(result)).toEqual({ "--a": "#FFFFFF" });
    expect(result.skipped).toBe(1);
  });

  it("warns about unreadable colours and missing or looping var()s", () => {
    const result = ok(
      parseCss(`
        --bad: #12345;
        --fn: rgb(nope);
        --missing: var(--elsewhere);
        --loop-a: var(--loop-b);
        --loop-b: var(--loop-a);
      `),
    );
    expect(result.tokens).toEqual([]);
    expect(result.warnings).toEqual([
      { path: "--bad", message: '"#12345" isn\'t a colour Linework can read. Use hex, rgb() or oklch().' },
      { path: "--fn", message: '"rgb(nope)" isn\'t a colour Linework can read. Use hex, rgb() or oklch().' },
      {
        path: "--missing",
        message: "Uses var(--elsewhere), which isn't in the pasted CSS. Paste the file that defines it too.",
      },
      { path: "--loop-a", message: "Its var() loops back to itself. Point it at a property with a value." },
      { path: "--loop-b", message: "Its var() loops back to itself. Point it at a property with a value." },
    ]);
  });

  it("tells font families from other words", () => {
    const result = parseCss(`
      --font-display: Georgia, "Times New Roman", serif;
      --font-body: Inter;
      --font-weight-bold: 700;
      --stack: system-ui, sans-serif;
      --mode: dark;
    `);
    expect(values(result)).toEqual({
      "--font-display": 'Georgia, "Times New Roman", serif',
      "--font-body": "Inter",
      "--stack": "system-ui, sans-serif",
    });
  });

  it("fails with a sign-style message when there is nothing to read", () => {
    expect(parseCss("  ")).toEqual({
      ok: false,
      error: { message: "The CSS is empty. Paste custom properties, like --color-primary: #1F6FEB;" },
    });
    expect(parseCss("body { color: red; }")).toEqual({
      ok: false,
      error: { message: "No custom properties found. Paste lines like --color-primary: #1F6FEB;" },
    });
    expect(parseCss(":root {\n  --a: #FFF;\n  /* unfinished\n}")).toEqual({
      ok: false,
      error: { message: "Line 3 opens a comment that never closes. Add */ to close it.", line: 3 },
    });
  });
});
