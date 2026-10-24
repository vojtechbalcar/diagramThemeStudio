import { DIAGRAMS } from "../src/lib/theme/diagrams";
import { expect, test } from "@playwright/test";
import { decodeState, encodeState } from "../src/lib/state/url";
import { PRESETS } from "../src/lib/tokens/presets";

test("exports each config format and copies the visible output", async ({ page, context }) => {
  const problems: string[] = [];
  page.on("console", (message) => { if (["error", "warning"].includes(message.type())) problems.push(message.text()); });
  page.on("pageerror", (error) => problems.push(error.message));
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/editor");
  await expect(page.getByRole("button", { name: "Export", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Use Signal preset" }).click();
  await expect(page.locator(".diagram-body svg")).toHaveCount(DIAGRAMS.length);
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: "Export", exact: true });
  await expect(drawer.getByRole("table", { name: "Theme details" })).toContainText("Signal");
  await expect(drawer.getByRole("table")).toContainText("6 colours, 1 font, 1 size");
  await drawer.getByRole("tab", { name: "JSON", exact: true }).click();
  const output = drawer.getByRole("textbox", { name: "Export output" });
  const config = JSON.parse(await output.inputValue());
  expect(config).toMatchObject({ theme: "base", securityLevel: "strict", themeVariables: { primaryColor: "#FFE14D" } });
  for (const label of ["Init directive", "mermaid.initialize()", "JSON"]) {
    await drawer.getByRole("tab", { name: label, exact: true }).click();
    await drawer.getByRole("button", { name: "Copy", exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(await output.inputValue());
    await expect(drawer.getByRole("status")).toContainText("Copied");
  }
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Export", exact: true })).toBeFocused();
  expect(problems).toEqual([]);
});

test("share links restore the full set and keep committed edits on reload", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/editor");
  await page.getByRole("button", { name: "Use Forest preset" }).click();
  await page.getByRole("textbox", { name: "Set name" }).fill("Žlutá · 東京");
  await page.getByRole("combobox", { name: "Primary fill", exact: true }).selectOption("");
  await page.getByText("Ink", { exact: true }).click();
  await page.getByRole("button", { name: "Share link", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("/editor#lw=1.");
  const shared = new URL(await page.evaluate(() => navigator.clipboard.readText()));
  const decoded = await decodeState(shared.hash);
  expect(decoded).toMatchObject({ ok: true, set: { name: "Žlutá · 東京", surface: "ink" } });
  if (!decoded.ok || !decoded.set) throw new Error("Missing shared state");
  expect(decoded.set.mapping.primaryColor).toBeUndefined();
  expect(decoded.set.tokens).toHaveLength(PRESETS[2].set.tokens.length);
  await page.goto(shared.href);
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Set name" })).toHaveValue("Žlutá · 東京");
  await expect(page.getByRole("combobox", { name: "Primary fill", exact: true })).toHaveValue("");
  await expect(page.getByRole("radio", { name: "Ink", exact: true })).toBeChecked();
  await page.getByRole("textbox", { name: "Set name" }).fill("Revised set");
  await expect.poll(async () => {
    const state = await decodeState(new URL(page.url()).hash);
    return state.ok ? state.set?.name : null;
  }).toBe("Revised set");
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Set name" })).toHaveValue("Revised set");
});

test("invalid links preserve the current set and hash navigation restores valid sets", async ({ page }) => {
  await page.goto("/editor#lw=1.invalid");
  await expect(page.getByText(/share link could not be read/i)).toBeVisible();
  await page.getByRole("button", { name: "Use Night preset" }).click();
  await expect.poll(() => page.url()).not.toContain("#lw=1.invalid");
  await page.evaluate(() => { location.hash = "lw=2.unknown"; });
  await expect(page.getByText(/unsupported version/i)).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Set name" })).toHaveValue("Night");
  const forest = await encodeState(PRESETS[2].set);
  await page.evaluate((hash) => { location.hash = hash; }, forest);
  await expect(page.getByRole("textbox", { name: "Set name" })).toHaveValue("Forest");
  await page.goBack();
  await expect(page.getByText(/unsupported version/i)).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Set name" })).toHaveValue("Forest");
  await page.goBack();
  await expect(page.getByRole("textbox", { name: "Set name" })).toHaveValue("Night");
});

test("a slow link restore cannot overwrite a newer edit", async ({ page }) => {
  await page.goto("/editor");
  await page.getByRole("button", { name: "Use Signal preset" }).click();
  await expect.poll(() => page.url()).toContain("#lw=1.");
  await page.evaluate(() => {
    const Native = window.DecompressionStream;
    const gate = new Promise<void>((resolve) => Object.defineProperty(window, "releaseDecode", { value: resolve }));
    window.DecompressionStream = class extends Native {
      get readable() {
        return super.readable.pipeThrough(new TransformStream({
          async transform(chunk, controller) {
            Object.defineProperty(window, "decodeStarted", { value: true, configurable: true });
            await gate;
            controller.enqueue(chunk);
          },
          flush() { Object.defineProperty(window, "decodeFinished", { value: true, configurable: true }); },
        }));
      }
    };
  });
  const forest = await encodeState(PRESETS[2].set);
  await page.evaluate((hash) => { location.hash = hash; }, forest);
  await expect.poll(() => page.evaluate(() => Reflect.get(window, "decodeStarted"))).toBe(true);
  await page.getByRole("textbox", { name: "Set name" }).fill("Keep this edit");
  await expect.poll(async () => {
    const decoded = await decodeState(new URL(page.url()).hash);
    return decoded.ok ? decoded.set?.name : null;
  }).toBe("Keep this edit");
  await page.evaluate(() => { const release = Reflect.get(window, "releaseDecode"); if (typeof release === "function") release(); });
  await expect.poll(() => page.evaluate(() => Reflect.get(window, "decodeFinished"))).toBe(true);
  await expect(page.getByRole("textbox", { name: "Set name" })).toHaveValue("Keep this edit");
});

test("clipboard denial leaves the export available for manual copying", async ({ page }) => {
  await page.goto("/editor");
  await page.getByRole("button", { name: "Use Signal preset" }).click();
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.evaluate(() => { Object.defineProperty(navigator.clipboard, "writeText", { value: async () => { throw new DOMException("Denied", "NotAllowedError"); } }); });
  const drawer = page.getByRole("dialog", { name: "Export", exact: true });
  await drawer.getByRole("button", { name: "Copy", exact: true }).click();
  await expect(drawer.getByRole("status")).toContainText("Select the output and copy it manually.");
  await expect(drawer.getByRole("textbox", { name: "Export output" })).toHaveValue(/^%%\{init:/);
});

test("header sharing cancels if the set changes during compression", async ({ page }) => {
  await page.goto("/editor");
  await page.getByRole("button", { name: "Use Signal preset" }).click();
  await expect.poll(() => page.url()).toContain("#lw=1.");
  await page.evaluate(() => {
    const copied: string[] = [];
    Object.defineProperty(window, "copiedShares", { value: copied });
    Object.defineProperty(navigator.clipboard, "writeText", { value: async (text: string) => { copied.push(text); } });
    const Native = window.CompressionStream;
    const gate = new Promise<void>((resolve) => Object.defineProperty(window, "releaseEncode", { value: resolve }));
    window.CompressionStream = class extends Native {
      get readable() {
        return super.readable.pipeThrough(new TransformStream({ async transform(chunk, controller) {
          Object.defineProperty(window, "encodeStarted", { value: true, configurable: true });
          await gate;
          controller.enqueue(chunk);
        } }));
      }
    };
  });
  await page.getByRole("button", { name: "Share link", exact: true }).click();
  await expect.poll(() => page.evaluate(() => Reflect.get(window, "encodeStarted"))).toBe(true);
  await page.getByRole("textbox", { name: "Set name" }).fill("Newer set");
  await page.evaluate(() => { const release = Reflect.get(window, "releaseEncode"); if (typeof release === "function") release(); });
  await expect(page.getByText("The set changed. Copy the share link again.", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => Reflect.get(window, "copiedShares"))).toEqual([]);
});

for (const state of ["pending", "unavailable"] as const) {
  test(`the title block reports ${state} contrast without blocking output`, async ({ page }) => {
    await page.goto("/editor");
    await page.evaluate((status) => {
      Object.defineProperty(document.fonts, "ready", { get: () => status === "pending" ? new Promise(() => {}) : Promise.reject(new Error("Fonts unavailable")) });
    }, state);
    await page.getByRole("button", { name: "Use Signal preset" }).click();
    if (state === "unavailable") await expect(page.locator(".diagram-body[aria-busy='true']")).toHaveCount(0);
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "Export", exact: true });
    await expect(drawer.getByRole("table")).toContainText(state === "pending" ? "Checking contrast…" : "Unavailable");
    await expect(drawer.getByRole("table")).not.toContainText(/\d+ pass/);
    await expect(drawer.getByRole("button", { name: "Copy", exact: true })).toBeEnabled();
  });
}

test("a failing contrast pair warns without blocking export", async ({ page }) => {
  await page.goto("/editor");
  await page.getByRole("button", { name: "Use Signal preset" }).click();
  const primary = PRESETS[1].set.mapping.primaryColor!.tokenId;
  await page.getByRole("combobox", { name: "Primary text", exact: true }).selectOption(primary);
  await expect(page.locator(".diagram-body[aria-busy='true']")).toHaveCount(0);
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const drawer = page.getByRole("dialog", { name: "Export", exact: true });
  await expect(drawer.getByText(/Export is allowed, but .* fails? contrast/)).toBeVisible();
  await expect(drawer.getByRole("button", { name: "Copy", exact: true })).toBeEnabled();
});

test("export tabs and the share output work on a narrow dark screen", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/editor");
  const views = page.getByRole("group", { name: "Editor view" });
  await views.getByText("Tokens", { exact: true }).click();
  await page.getByRole("region", { name: "Tokens and mapping", exact: true }).getByRole("button", { name: "Use Night preset" }).click();
  await views.getByText("Export", { exact: true }).click();
  const drawer = page.getByRole("region", { name: "Export", exact: true });
  await drawer.getByRole("tab", { name: "Init directive", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(drawer.getByRole("tab", { name: "mermaid.initialize()", exact: true })).toHaveAttribute("aria-selected", "true");
  await drawer.getByRole("tab", { name: "Share link", exact: true }).click();
  await expect(drawer.getByRole("textbox", { name: "Export output" })).toHaveValue(/\/editor#lw=1\./);
  await drawer.getByRole("button", { name: "Copy", exact: true }).click();
  await expect(drawer.getByRole("status")).toContainText("Share link copied.");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = await drawer.boundingBox();
  expect(box!.width).toBeLessThanOrEqual(320);
});
