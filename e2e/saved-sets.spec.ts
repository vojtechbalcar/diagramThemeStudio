import { expect, test, type Page } from "@playwright/test";
import { PRESETS } from "../src/lib/tokens/presets";
import { encodeState } from "../src/lib/state/url";

const id = "346240c7-8aca-4ad1-90e5-adff4b772740";
function savedDocument(revision = 1) {
  const set = PRESETS[1].set;
  return { id, name: set.name, set, tokenCount: set.tokens.length, colors: ["#DC2626"], revision, createdAt: "2026-10-22T12:00:00.000Z", updatedAt: "2026-10-22T12:00:00.000Z" };
}
async function account(page: Page) { await page.route("**/api/account", (route) => route.fulfill({ json: { available: true, userId: "user_test" } })); }

test("library opens and confirms deletion of private sets", async ({ page }) => {
  await account(page);
  let deleted = false;
  await page.route("**/api/sets", (route) => route.fulfill({ json: { items: deleted ? [] : [savedDocument()], nextCursor: null } }));
  await page.route(`**/api/sets/${id}`, async (route) => {
    if (route.request().method() === "DELETE") { expect(route.request().postDataJSON()).toEqual({ revision: 1 }); deleted = true; await route.fulfill({ status: 204 }); }
    else await route.fulfill({ json: savedDocument() });
  });
  await page.goto("/sets");
  await expect(page.getByRole("heading", { name: "Signal", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Signal" })).toHaveAttribute("href", `/editor?set=${id}`);
  const remove = page.getByRole("button", { name: "Delete Signal" });
  await remove.click();
  await page.keyboard.press("Escape");
  await expect(remove).toBeFocused();
  await remove.click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete set", exact: true }).click();
  await expect(page.getByText("No saved sets yet.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your themes, kept together." })).toBeFocused();
});

test("save creates, updates and offers a copy after a revision conflict", async ({ page }) => {
  await account(page);
  let creates = 0;
  await page.route("**/api/sets", async (route) => { creates++; expect(route.request().postDataJSON().set.tokens.length).toBeGreaterThan(0); await route.fulfill({ json: savedDocument(), status: 201 }); });
  await page.route(`**/api/sets/${id}`, (route) => route.fulfill({ status: 409, json: { error: "This set changed elsewhere. Save a copy." } }));
  await page.goto("/editor");
  await page.getByRole("button", { name: "Use Night preset" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Save set", exact: true }).click();
  await expect(page).toHaveURL(/set=.*rev=1/);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Update set", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("changed elsewhere");
  await page.getByRole("checkbox", { name: "Save a copy" }).check();
  await page.getByRole("dialog").getByRole("button", { name: "Save set", exact: true }).click();
  expect(creates).toBe(2);
});

test("remote opening preserves a newer local fragment and ignores slow fetches after edits", async ({ page }) => {
  await account(page);
  let reads = 0;
  await page.route(`**/api/sets/${id}`, async (route) => { reads++; await new Promise((resolve) => setTimeout(resolve, 700)); await route.fulfill({ json: savedDocument(3) }); });
  await page.goto(`/editor?set=${id}`);
  await expect(page.getByRole("textbox", { name: "Set name" })).toHaveValue("Signal");
  await expect(page).toHaveURL(/rev=3/);
  const fragment = await encodeState(PRESETS[3].set);
  await page.goto(`/editor?set=${id}&rev=1${fragment}`);
  await expect(page.getByRole("textbox", { name: "Set name" })).toHaveValue("Night");
  expect(reads).toBe(1);
  await page.goto(`/editor?set=${id}`);
  await page.getByRole("textbox", { name: "Set name" }).fill("My new draft");
  await page.waitForTimeout(900);
  await expect(page.getByRole("textbox", { name: "Set name" })).toHaveValue("My new draft");
});

test("library has useful unavailable and retry states", async ({ page }) => {
  await page.route("**/api/account", (route) => route.fulfill({ json: { available: false, userId: null } }));
  await page.goto("/sets");
  await expect(page.getByText("Accounts are not available here yet.")).toBeVisible();
  await account(page);
  let failed = true;
  await page.route("**/api/sets", (route) => route.fulfill({ status: failed ? 503 : 200, json: failed ? { error: "Try your library again." } : { items: [], nextCursor: null } }));
  await page.reload();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Try your library again.");
  failed = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByText("No saved sets yet.")).toBeVisible();
});

test("an invalid local fragment falls back to the saved theme", async ({ page }) => {
  await account(page);
  await page.route(`**/api/sets/${id}`, (route) => route.fulfill({ json: savedDocument() }));
  await page.goto(`/editor?set=${id}#invalid`);
  await expect(page.getByRole("textbox", { name: "Set name" })).toHaveValue("Signal");
});

test("phone views share one pending save and fit at 320px", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await account(page);
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/sets", async (route) => { await held; await route.fulfill({ json: savedDocument(), status: 201 }); });
  await page.goto("/editor");
  await page.getByRole("group", { name: "Editor view" }).getByText("Tokens", { exact: true }).click();
  await page.getByRole("button", { name: "Use Night preset" }).click();
  await expect(page.getByRole("banner").getByRole("button", { name: "Export", exact: true })).toBeHidden();
  await expect(page.getByRole("banner").getByRole("button", { name: "Share link", exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Save set", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("group", { name: "Editor view" }).getByText("Export", { exact: true }).click();
  try {
    await expect(page.getByRole("button", { name: "Saving…", exact: true }).filter({ visible: true })).toBeDisabled();
    await expect(page.getByRole("banner").getByRole("link", { name: "Sets", exact: true })).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole("banner").getByRole("button", { name: "Dark mode", exact: true })).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath("phone-save.png") });
  } finally { release(); }
});

test("a finished save cannot attach its identity to a different fragment draft", async ({ page }) => {
  await account(page);
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/sets", async (route) => { await held; await route.fulfill({ json: savedDocument(), status: 201 }); });
  await page.goto("/editor");
  await page.getByRole("button", { name: "Use Night preset" }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Save set", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  const response = page.waitForResponse((response) => response.url().endsWith("/api/sets") && response.request().method() === "POST");
  await page.evaluate((fragment) => { window.location.hash = fragment; }, await encodeState(PRESETS[2].set));
  await expect(page.getByRole("textbox", { name: "Set name" })).toHaveValue("Forest");
  release();
  await response;
  await expect(page.getByRole("button", { name: "Save", exact: true })).toBeEnabled();
  expect(new URL(page.url()).searchParams.has("set")).toBe(false);
});

test("the library wraps long names at 320px", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await account(page);
  await page.route("**/api/sets", (route) => route.fulfill({ json: { items: [{ ...savedDocument(), name: "A".repeat(80) }], nextCursor: null } }));
  await page.goto("/sets");
  await expect(page.getByRole("heading", { name: "A".repeat(80), exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("phone-library.png") });
});

test("saving a captured version preserves newer edits and keyboard focus", async ({ page }) => {
  await account(page);
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/sets", async (route) => { await held; await route.fulfill({ json: { ...savedDocument(), name: "Night", set: PRESETS[3].set }, status: 201 }); });
  await page.goto("/editor");
  await page.getByRole("button", { name: "Use Night preset" }).click();
  const save = page.getByRole("button", { name: "Save", exact: true });
  await save.focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog").getByRole("textbox", { name: "Saved name" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(save).toBeFocused();
  await save.click();
  await page.getByRole("dialog").getByRole("button", { name: "Save set", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("textbox", { name: "Set name" }).fill("My newer edits");
  await expect(page).toHaveURL(/#lw=1\./);
  release();
  await expect(page).toHaveURL(/set=.*rev=1/);
  await expect(page.getByRole("textbox", { name: "Set name" })).toHaveValue("My newer edits");
  await expect(page.getByText(/Earlier version saved/)).toBeVisible();
});

test("changing accounts discards the previous private library", async ({ page }) => {
  let userId = "user_a";
  await page.route("**/api/account", (route) => route.fulfill({ json: { available: true, userId } }));
  await page.route("**/api/sets", (route) => route.fulfill({ json: { items: userId === "user_a" ? [savedDocument()] : [], nextCursor: null } }));
  await page.goto("/sets");
  await expect(page.getByRole("heading", { name: "Signal", exact: true })).toBeVisible();
  userId = "user_b";
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByText("No saved sets yet.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Signal", exact: true })).toHaveCount(0);
});

test("navigating to another draft dismisses an already open Save dialog", async ({ page }) => {
  await account(page);
  await page.route(`**/api/sets/${id}`, (route) => route.fulfill({ json: savedDocument() }));
  await page.goto(`/editor?set=${id}`);
  await expect(page.getByRole("textbox", { name: "Set name" })).toHaveValue("Signal");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.evaluate((fragment) => { window.location.hash = fragment; }, await encodeState(PRESETS[2].set));
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Set name" })).toHaveValue("Forest");
});
