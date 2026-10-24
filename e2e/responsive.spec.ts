import { DIAGRAMS } from "../src/lib/theme/diagrams";
import { expect, test } from "@playwright/test";

for (const mode of ["light", "dark"] as const) {
  test(`phone views keep import, mapping, focus and export reachable in ${mode}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/editor");
    const views = page.getByRole("group", { name: "Editor view" });
    await expect(views).toBeVisible();
    await views.getByText("Tokens", { exact: true }).click();
    await expect(page.getByRole("button", { name: "Import", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Use Night preset" }).click();
    await page.getByRole("textbox", { name: "Set name" }).fill("Phone palette");
    await page.getByRole("combobox", { name: "Primary fill", exact: true }).selectOption("");
    await views.getByText("Canvas", { exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Set name" })).toBeHidden();
    await page.getByRole("button", { name: "Open Flowchart focus mode" }).click();
    const focus = page.getByRole("dialog", { name: "Flowchart focus mode" });
    await expect(focus.getByRole("textbox", { name: "Diagram source" })).toBeVisible();
    await page.keyboard.press("Escape");
    await views.getByText("Export", { exact: true }).click();
    await expect(page.getByRole("table", { name: "Theme details" })).toContainText("Phone palette");
    await page.getByRole("tab", { name: "Share link", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Export output" })).toHaveValue(/#lw=1\./);
    await page.getByRole("button", { name: "Select color.navy", exact: true }).click();
    await expect(views.getByRole("radio", { name: "Tokens", exact: true })).toBeChecked();
    await expect(page.getByRole("textbox", { name: "Value for color.navy", exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("tablet retains the Tokens drawer and desktop retains its sidebar", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1000 });
  await page.goto("/editor");
  await page.getByRole("button", { name: "Tokens", exact: true }).click();
  const tokens = page.getByRole("dialog", { name: "Tokens and mapping" });
  await tokens.getByRole("button", { name: "Use Signal preset" }).click();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(page.getByRole("textbox", { name: "Set name" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tokens", exact: true })).toBeHidden();
});

test("new renders crossfade in reading order and reduced motion removes timing", async ({ page }) => {
  await page.goto("/editor");
  await page.getByRole("button", { name: "Use Signal preset" }).click();
  await expect(page.locator(".diagram-body svg")).toHaveCount(DIAGRAMS.length);
  await page.getByText("Start from a preset", { exact: true }).click();
  await page.getByRole("button", { name: "Use Forest preset" }).click();
  await expect(page.locator('.diagram-picture-current')).toHaveCount(DIAGRAMS.length);
  const timings = await page.locator('.diagram-picture-current').evaluateAll((pictures) => pictures.map((picture) => {
    const style = getComputedStyle(picture);
    return [style.animationDuration, style.animationDelay];
  }));
  expect(timings).toEqual([["0.16s", "0s"], ["0.16s", "0.03s"], ["0.16s", "0.06s"], ["0.16s", "0.09s"]]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const reduced = await page.locator('.diagram-picture-current').evaluateAll((pictures) => pictures.map((picture) => [getComputedStyle(picture).animationDuration, getComputedStyle(picture).animationDelay]));
  expect(reduced.every(([duration, delay]) => duration === "0s" && delay === "0s")).toBe(true);
});

test("phone token edits stay committed and repeated palette selection refocuses the value", async ({ page }) => {
  await page.clock.install();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/editor");
  const views = page.getByRole("group", { name: "Editor view" });
  await views.getByText("Tokens", { exact: true }).click();
  await page.getByRole("button", { name: "Use Night preset" }).click();
  await page.getByRole("button", { name: "Select color.navy", exact: true }).click();
  const value = page.getByRole("textbox", { name: "Value for color.navy", exact: true });
  await expect(page.locator('input[id$="-value"]')).toHaveCount(1);
  await value.fill("#123456");
  await value.blur();
  await page.clock.runFor(1000);
  await expect(page.getByRole("button", { name: "Edit color.navy", exact: true })).toContainText("#123456");
  await expect(page.getByRole("button", { name: "Select color.navy", exact: true })).toHaveAttribute("title", "color.navy: #123456");
  await views.getByText("Canvas", { exact: true }).click();
  await page.getByRole("button", { name: "Select color.navy", exact: true }).click();
  await expect(value).toBeFocused();
  await page.getByRole("button", { name: "Select color.navy", exact: true }).click();
  await expect(value).toBeFocused();
  await expect(value).toHaveValue("#123456");
});
