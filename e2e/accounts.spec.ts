import { expect, test } from "@playwright/test";

test("configured accounts expose the saved sets destination", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (message) => { if (["error", "warning"].includes(message.type())) problems.push(message.text()); });
  page.on("pageerror", (error) => problems.push(error.message));
  await page.route("**/api/account", (route) => route.fulfill({ json: { available: true, userId: "user_test" } }));
  await page.goto("/editor");
  await expect(page.getByRole("link", { name: "Saved sets", exact: true })).toHaveAttribute("href", "/sets");
  await page.getByRole("button", { name: "Use Night preset" }).click();
  await expect(page.getByRole("textbox", { name: "Set name" })).toHaveValue("Night");
  expect(problems).toEqual([]);
});

test("unconfigured accounts leave the anonymous editor usable", async ({ page }) => {
  await page.route("**/api/account", (route) => route.fulfill({ json: { available: false, userId: null } }));
  await page.goto("/editor");
  await expect(page.getByRole("link", { name: /^(Saved sets|Sets)$/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Use Night preset" }).click();
  await expect(page.getByRole("textbox", { name: "Set name" })).toHaveValue("Night");
});

test("account navigation stays within a phone band", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.route("**/api/account", (route) => route.fulfill({ json: { available: true, userId: "user_test" } }));
  await page.goto("/editor");
  const sets = page.getByRole("link", { name: "Sets", exact: true });
  await expect(sets).toBeVisible();
  await expect(sets).toHaveAttribute("href", "/sets");
  expect(await page.locator("header").first().evaluate((header) => header.scrollWidth <= header.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("account availability refreshes on focus and invalid responses hide navigation", async ({ page }) => {
  let response: object = { available: true, userId: "user_test" };
  await page.route("**/api/account", (route) => route.fulfill({ json: response }));
  await page.goto("/editor");
  await expect(page.getByRole("link", { name: "Saved sets", exact: true })).toBeVisible();
  response = { available: "yes", userId: "user_test" };
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByRole("link", { name: "Saved sets", exact: true })).toHaveCount(0);
  response = { available: true, userId: null };
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByRole("link", { name: "Saved sets", exact: true })).toBeVisible();
});
