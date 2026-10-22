import { describe, expect, it } from "vitest";
import { decodeState, encodeState, shareUrl, MAX_FRAGMENT_LENGTH } from "@/lib/state/url";
import { createEditorSet } from "@/lib/state/editor";
import { PRESETS } from "@/lib/tokens/presets";

async function rawFragment(value: unknown): Promise<string> {
  const stream = new Blob([JSON.stringify(value)]).stream().pipeThrough(new CompressionStream("deflate"));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  const encoded = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join("")).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  return `#lw=1.${encoded}`;
}

describe("URL state", () => {
  it("round trips every preset and an empty set", async () => {
    for (const set of [createEditorSet(), ...PRESETS.map((preset) => preset.set)]) {
      const fragment = await encodeState(set);
      expect(fragment).toMatch(/^#lw=1\.[A-Za-z0-9_-]+$/);
      expect(await decodeState(fragment)).toEqual({ ok: true, set });
      expect(fragment.length).toBeLessThan(JSON.stringify(set).length + 100);
    }
  });

  it("preserves Unicode, alpha, manual ids, mapping confirmation and surface", async () => {
    const set = structuredClone(PRESETS[0].set);
    set.name = "Žlutá · 東京";
    set.tokens[0].path = "barva.žlutá.東京";
    set.tokens[0].alpha = 0.375;
    set.surface = "ink";
    set.mapping.primaryColor!.auto = true;
    expect(await decodeState(await encodeState(set))).toEqual({ ok: true, set });
  });

  it("reports malformed, truncated, unsupported and oversized fragments without throwing", async () => {
    for (const fragment of ["#lw=2.abc", "#lw=1.%", "#lw=1.a", "#lw=1.", "#lw=1.not-a-stream", "#other", `#lw=1.${"a".repeat(MAX_FRAGMENT_LENGTH)}`]) {
      expect((await decodeState(fragment)).ok, fragment.slice(0, 40)).toBe(false);
    }
    expect(await decodeState("")).toEqual({ ok: true, set: null });
    const valid = await encodeState(PRESETS[0].set);
    expect((await decodeState(valid.slice(0, -5))).ok).toBe(false);
  });

  it("validates decoded tokens and mappings before restoring state", async () => {
    const set = PRESETS[0].set;
    for (const invalid of [
      { ...set, version: 2 },
      { ...set, tokens: [...set.tokens, set.tokens[0]] },
      { ...set, mapping: { primaryColor: { tokenId: "missing", auto: false } } },
      { ...set, mapping: { fontFamily: { tokenId: set.tokens[0].id, auto: false } } },
      { ...set, tokens: [{ ...set.tokens[0], value: "red" }] },
      { ...set, surface: "wrong" },
      { ...set, name: "x".repeat(81) },
    ]) {
      expect((await decodeState(await rawFragment(invalid))).ok).toBe(false);
    }
  });

  it("bounds decompression before parsing a compressed oversized document", async () => {
    const fragment = await rawFragment({ junk: "x".repeat(1_100_000) });
    expect(fragment.length).toBeLessThan(3000);
    expect(await decodeState(fragment)).toMatchObject({ ok: false, error: expect.stringContaining("too large") });
  });

  it("rejects CSS declarations in shared fonts while retaining quoted Unicode font stacks", async () => {
    const set = structuredClone(PRESETS[0].set);
    const font = set.tokens.find((token) => token.type === "fontFamily")!;
    for (const value of ['sans-serif; background-image: url(https://example.invalid/pixel)', '"broken\nfont"', '"</style>"']) {
      font.value = value;
      expect((await decodeState(await rawFragment(set))).ok, value).toBe(false);
    }
    font.value = '"日本語フォント", "Helvetica Neue", sans-serif';
    expect(await decodeState(await rawFragment(set))).toEqual({ ok: true, set });
  });

  it("generates a canonical current-origin editor URL without search parameters", async () => {
    const set = PRESETS[0].set;
    const url = new URL(await shareUrl(set, "https://linework.example/editor?tracking=secret#old"));
    expect(url.origin).toBe("https://linework.example");
    expect(url.pathname).toBe("/editor");
    expect(url.search).toBe("");
    expect(await decodeState(url.hash)).toEqual({ ok: true, set });
    const credentials = new URL(await shareUrl(set, "https://user:password@linework.example/editor"));
    expect(credentials.username).toBe("");
    expect(credentials.password).toBe("");
  });
});
