import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PALETTE, SEMANTIC } from "@/lib/system/palette";

const css = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8").toLowerCase();

function declaration(token: string): string | undefined {
  const match = new RegExp(`${token}:\\s*([^;]+);`).exec(css);
  return match?.[1].trim();
}

/** The specimen page shows these values; globals.css is what renders. They must agree. */
describe("palette data matches globals.css", () => {
  it.each(PALETTE.map((c) => [c.token, c.hex] as const))("%s is %s", (token, hex) => {
    const value = declaration(token);
    expect(value === hex.toLowerCase() || value?.startsWith(`light-dark(${hex.toLowerCase()},`)).toBe(true);
  });

  it.each(SEMANTIC.map((t) => [t.token, t.light, t.dark] as const))("%s is %s / %s", (token, light, dark) => {
    expect(declaration(token)).toBe(`light-dark(${light}, ${dark})`.toLowerCase());
  });
});
