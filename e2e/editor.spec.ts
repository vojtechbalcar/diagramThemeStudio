import { expect, test } from "@playwright/test";
import { contrastRatio, formatRatio } from "../src/lib/contrast/wcag";
import { composite, normaliseCssColour } from "../src/lib/tokens/colour";

test("import, map and edit a theme across all four live previews", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (message) => { if (["error", "warning"].includes(message.type())) problems.push(message.text()); });
  page.on("pageerror", (error) => problems.push(error.message));
  await page.goto("/editor");
  await expect(page.getByRole("heading", { name: "Theme editor" })).toBeVisible();
  await expect(page.getByText("No tokens yet.", { exact: false }).first()).toBeVisible();
  await page.getByRole("button", { name: "Import", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Import tokens" });
  await dialog.getByText("CSS variables", { exact: true }).click();
  await dialog.getByRole("textbox", { name: "Token source" }).fill(":root { --primary: #FFE14D; --text: #141414; --background: #FFFFFF; --line: #141414; --font-family: Inter; --font-size: 14px; }");
  await expect(dialog.getByRole("status")).toContainText("4 colours, 1 font, 1 size found");
  await dialog.getByRole("button", { name: "Use tokens" }).click();
  await expect(page.locator(".diagram-body svg")).toHaveCount(4);
  await expect(page.locator(".diagram-body[aria-busy='true']")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Flowchart contrast" })).toContainText("Primary text on primary fill");
  await page.getByRole("combobox", { name: "Primary fill", exact: true }).selectOption({ label: "--primary" });
  await page.getByRole("button", { name: "Edit --primary", exact: true }).click();
  const value = page.getByRole("textbox", { name: "Value for --primary", exact: true });
  await value.fill("invalid");
  await expect(value).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator(".diagram-body svg")).toHaveCount(4);
  await value.fill("#123456");
  await value.blur();
  await expect(value).toHaveValue("#123456");
  await expect(page.locator(".diagram-body[aria-busy='true']")).toHaveCount(0);
  await expect(page.locator("[data-diagram='flowchart'] .diagram-svg svg")).toContainText("Add tokens");
  await expect.poll(async () => (await page.locator("[data-diagram='flowchart'] svg style").allTextContents()).join("")).toContain("#123456");
  await page.getByRole("switch", { name: "Show contrast" }).click();
  await expect(page.getByRole("region", { name: "Flowchart contrast" })).toHaveCount(0);
  for (const surface of ["Paper", "Ink", "Brand"]) {
    await page.getByText(surface, { exact: true }).click();
    await expect(page.getByRole("radio", { name: surface, exact: true })).toBeChecked();
    await expect(page.locator(".diagram-body[aria-busy='true']")).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Dark mode" }).click();
  await expect(page.getByRole("button", { name: "Dark mode" })).toHaveAttribute("aria-pressed", "true");
  expect(problems).toEqual([]);
});

test("presets, colour strip selection, manual tokens and keyboard dialogs", async ({ page }) => {
  await page.goto("/editor");
  await page.getByRole("button", { name: "Use Forest preset" }).click();
  await expect(page.locator(".diagram-body svg")).toHaveCount(4);
  await page.getByRole("button", { name: "Select color.moss", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Value for color.moss" })).toBeFocused();
  await page.getByRole("combobox", { name: "Primary fill", exact: true }).selectOption("");
  await expect(page.getByRole("combobox", { name: "Primary fill", exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Add token", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Add token" });
  await dialog.getByRole("textbox", { name: "Token path" }).fill("color.custom");
  await dialog.getByRole("textbox", { name: "Token value" }).fill("#abc");
  await dialog.getByRole("button", { name: "Add token", exact: true }).click();
  await expect(page.getByRole("button", { name: "Edit color.custom", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Token source" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Import", exact: true })).toBeFocused();
});

test("the editor fits a phone and keeps token controls accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/editor");
  await page.getByRole("button", { name: "Tokens", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Tokens and mapping" });
  await expect(panel).toBeVisible();
  await panel.getByRole("button", { name: "Use Night preset" }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".diagram-body svg")).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("switching tokens immediately after typing preserves the valid edit", async ({ page }) => {
  await page.goto("/editor");
  await page.getByRole("button", { name: "Use Signal preset" }).click();
  await page.getByRole("button", { name: "Edit color.yellow", exact: true }).click();
  await page.getByRole("textbox", { name: "Value for color.yellow", exact: true }).fill("#123456");
  // Switch in one browser task so pointer auto-waiting cannot hide the debounce race.
  await page.getByRole("button", { name: "Select color.black", exact: true }).evaluate((button) => { if (button instanceof HTMLButtonElement) { button.focus(); button.click(); } });
  await expect(page.getByRole("button", { name: "Edit color.yellow", exact: true })).toContainText("#123456");
});

test("contrast annotations match the SVG attribute rows and translucent Gantt sections", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (message) => { if (["error", "warning"].includes(message.type())) problems.push(message.text()); });
  page.on("pageerror", (error) => problems.push(error.message));
  await page.goto("/editor");
  for (const name of ["Ink & paper", "Signal", "Forest", "Night"]) {
    const presets = page.locator("details");
    if (!await presets.evaluate((element) => element instanceof HTMLDetailsElement && element.open)) await page.getByText("Start from a preset", { exact: true }).click();
    await page.getByRole("button", { name: `Use ${name} preset` }).click();
    await expect(page.locator(".diagram-body svg")).toHaveCount(4);
    await expect(page.locator(".diagram-body[aria-busy='true']")).toHaveCount(0);
    const colours = await page.evaluate(() => {
      function fill(selector: string) {
        const node = document.querySelector(selector);
        if (!node) throw new Error(`Missing ${selector}`);
        return getComputedStyle(node).fill;
      }
      const section = document.querySelector("[data-diagram=gantt] .diagram-svg .section");
      const surface = document.querySelector("[data-diagram=gantt] .diagram-body");
      if (!section || !surface) throw new Error("Missing Gantt section");
      return {
        attributeText: fill("[data-diagram=er] .attribute-name .text-inner-tspan"),
        odd: fill("[data-diagram=er] .row-rect-odd path"),
        even: fill("[data-diagram=er] .row-rect-even path"),
        sectionTitle: fill("[data-diagram=gantt] .sectionTitle0"),
        section: getComputedStyle(section).fill,
        opacity: Number(getComputedStyle(section).opacity),
        surface: getComputedStyle(surface).backgroundColor,
      };
    });
    const hex = (colour: string) => { const parsed = normaliseCssColour(colour); if (!parsed) throw new Error(colour); return parsed.hex; };
    for (const [label, background] of [["Attribute text on odd rows", colours.odd], ["Attribute text on even rows", colours.even]]) {
      const ratio = formatRatio(contrastRatio(hex(colours.attributeText), hex(background)));
      await expect(page.getByRole("region", { name: "Entity relationship contrast" }).locator("li").filter({ hasText: label })).toContainText(ratio);
    }
    const sectionFill = composite(hex(colours.section), colours.opacity, hex(colours.surface));
    await expect(page.getByRole("region", { name: "Gantt contrast" }).locator("li").filter({ hasText: "Section title on section fill" })).toContainText(formatRatio(contrastRatio(hex(colours.sectionTitle), sectionFill)));
  }
  expect(problems).toEqual([]);
});

for (const mode of ["light", "dark"] as const) {
  test(`preview surfaces stay independent of the ${mode} interface`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/editor");
    await page.getByRole("button", { name: "Use Night preset" }).click();
    await expect(page.locator(".diagram-body svg")).toHaveCount(4);
    for (const [label, colour] of [["Paper", "rgb(255, 255, 255)"], ["Ink", "rgb(11, 11, 11)"], ["Brand", "rgb(15, 20, 32)"]]) {
      await page.getByText(label, { exact: true }).click();
      await expect(page.locator(".diagram-body").first()).toHaveCSS("background-color", colour);
      await expect(page.locator(".diagram-body[aria-busy='true']")).toHaveCount(0);
    }
    await expect(page.getByRole("button", { name: "Dark mode" })).toHaveAttribute("aria-pressed", String(mode === "dark"));
  });
}
