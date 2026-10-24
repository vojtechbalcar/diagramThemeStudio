import { expect, test, type Page } from "@playwright/test";

/** Collects console errors and warnings; the definition of done allows none. */
function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") problems.push(message.text());
  });
  page.on("pageerror", (error) => problems.push(error.message));
  return problems;
}

test("the specimen renders every section without console problems", async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto("/system");

  await expect(page.getByRole("heading", { level: 1, name: "Graphics standards" })).toBeVisible();
  for (const title of [
    "Unit and module",
    "Colour",
    "Ink scopes and focus",
    "Typography",
    "Band",
    "Rules and frames",
    "Bullets",
    "Arrows",
    "Symbols",
    "Buttons and controls",
  ]) {
    await expect(page.getByRole("heading", { level: 2, name: title, exact: true })).toBeVisible();
  }
  expect(problems).toEqual([]);
});

test("the mode toggle switches, persists and returns to the system preference", async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto("/system");
  const html = page.locator("html");
  const toggle = page.getByRole("button", { name: "Dark mode" });

  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  // The stored choice is applied before paint on the next load.
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  const background = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  expect(background).toBe("rgb(11, 11, 11)");

  // The test browser prefers light, so choosing light clears the stored choice.
  await page.getByRole("button", { name: "Dark mode" }).click();
  await expect(html).not.toHaveAttribute("data-theme");
  expect(await page.evaluate(() => localStorage.getItem("lw-mode"))).toBeNull();
  expect(problems).toEqual([]);
});

test("follows the operating system in dark mode with no stored choice", async ({ browser }) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto("/system");
  await expect(page.getByRole("button", { name: "Dark mode" })).toHaveAttribute("aria-pressed", "true");
  const background = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  expect(background).toBe("rgb(11, 11, 11)");
  await context.close();
});

test("keyboard: the band comes first, then the contents", async ({ page }) => {
  await page.goto("/system");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Linework" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Dark mode" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /Unit and module/ })).toBeFocused();
});

test("keyboard: the live controls work and forced states are skipped", async ({ page }) => {
  await page.goto("/system");

  const toggle = page.getByRole("switch", { name: "Show contrast" }).first();
  await toggle.focus();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-checked", "false");

  // Forced-state copies are inert, so Tab goes from one live control to the next.
  const controls = page.locator("#controls");
  await controls.getByRole("button", { name: "Export", exact: true }).first().focus();
  await page.keyboard.press("Tab");
  await expect(controls.getByRole("button", { name: "Open the editor" }).first()).toBeFocused();

  // Arrow keys move the native radio selection.
  await page.getByRole("radio", { name: "Paper" }).first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: "Ink" }).first()).toBeChecked();

  // The focus ring is visible on the focused segment.
  const outline = await page
    .getByRole("radio", { name: "Ink" })
    .first()
    .evaluate((input) => getComputedStyle(input.closest("label")!).outlineStyle);
  expect(outline).toBe("solid");
});

test("the home page links to the specimen", async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto("/");
  await page.getByRole("link", { name: "View the system" }).click();
  await expect(page).toHaveURL(/\/system$/);
  expect(problems).toEqual([]);
});
