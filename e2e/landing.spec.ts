import { expect, test } from "@playwright/test";

test("landing shows four live themed panels, steps and the current palette", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (message) => { if (["error", "warning"].includes(message.type())) problems.push(message.text()); });
  page.on("pageerror", (error) => problems.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Diagrams in your brand’s colours." })).toBeVisible();
  const demo = page.getByRole("region", { name: "Live theme previews" });
  // Hold a deliberate preset while checking the initial proof; the carousel may
  // advance while Mermaid loads on a busy machine.
  await demo.getByRole("button", { name: "Pause preview", exact: true }).click();
  await demo.getByRole("button", { name: "Signal", exact: true }).click();
  await expect(demo.locator('.diagram-picture-current svg')).toHaveCount(4);
  for (const name of ["Flowchart", "Sequence", "Entity relationship", "Gantt"]) await expect(demo.getByRole("img", { name: new RegExp(`${name} preview`) })).toBeVisible();
  await expect(page.getByRole("list", { name: "How it works" }).getByRole("listitem")).toHaveCount(3);
  const palette = page.getByRole("contentinfo", { name: "Current preset palette" });
  await expect(palette).toContainText("#FFE14D");
  await demo.getByRole("button", { name: "Forest", exact: true }).click();
  await expect(demo).toHaveAttribute("data-preset", "forest");
  await expect(palette).not.toContainText("#FFE14D");
  await expect(demo.getByRole("img", { name: /Flowchart preview, themed with Forest/ })).toBeVisible();
  await page.getByRole("link", { name: "Open the editor", exact: true }).click();
  await expect(page).toHaveURL(/\/editor$/);
  expect(problems).toEqual([]);
});

test("landing cycle pauses on hover, focus and explicit Pause", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  const demo = page.getByRole("region", { name: "Live theme previews" });
  await demo.getByRole("button", { name: "Pause preview", exact: true }).click();
  await expect(demo.locator('.diagram-picture-current svg')).toHaveCount(4);
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 100));
  await demo.getByRole("button", { name: "Resume preview", exact: true }).click();
  await page.getByRole("heading", { level: 1 }).click();
  const first = await demo.getAttribute("data-preset");
  await page.clock.fastForward(3100);
  await expect(demo).not.toHaveAttribute("data-preset", first!);
  await demo.hover();
  const hovered = await demo.getAttribute("data-preset");
  await page.clock.fastForward(6500);
  await expect(demo).toHaveAttribute("data-preset", hovered!);
  await page.mouse.move(0, 0);
  await demo.getByRole("button", { name: "Signal", exact: true }).focus();
  await page.clock.fastForward(6500);
  await expect(demo).toHaveAttribute("data-preset", hovered!);
  await demo.getByRole("button", { name: "Pause preview", exact: true }).click();
  await page.getByRole("heading", { level: 1 }).click();
  await page.clock.fastForward(6500);
  await expect(demo).toHaveAttribute("data-preset", hovered!);
  await demo.getByRole("button", { name: "Resume preview", exact: true }).click();
  await page.getByRole("heading", { level: 1 }).click();
  await page.clock.fastForward(3100);
  await expect(demo).not.toHaveAttribute("data-preset", hovered!);
});

test("reduced motion keeps the landing still while manual presets remain available", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/");
  const demo = page.getByRole("region", { name: "Live theme previews" });
  await expect(demo.locator('.diagram-picture-current svg')).toHaveCount(4);
  await page.clock.fastForward(10_000);
  await expect(demo).toHaveAttribute("data-preset", "signal");
  await demo.getByRole("button", { name: "Night", exact: true }).click();
  await expect(demo).toHaveAttribute("data-preset", "night");
  await page.clock.fastForward(10_000);
  await expect(demo).toHaveAttribute("data-preset", "night");
});

for (const mode of ["light", "dark"] as const) {
  test(`landing fits a 320px ${mode} screen`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Open the editor", exact: true })).toBeVisible();
    await expect(page.locator('.landing-demo .diagram-picture-current svg')).toHaveCount(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("hidden pages suspend cycling and resume when visible", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  const demo = page.getByRole("region", { name: "Live theme previews" });
  await expect(demo.locator('.diagram-picture-current svg')).toHaveCount(4);
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 100));
  const preset = await demo.getAttribute("data-preset");
  await page.evaluate(() => { Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await page.clock.fastForward(6500);
  await expect(demo).toHaveAttribute("data-preset", preset!);
  await page.evaluate(() => { Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true }); document.dispatchEvent(new Event("visibilitychange")); });
  await page.clock.fastForward(3100);
  await expect(demo).not.toHaveAttribute("data-preset", preset!);
});
