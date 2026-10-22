import { expect, test } from "@playwright/test";

test("focus edits render locally, reset errors, and export the current source", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(error.message));
  await page.goto("/editor");
  await page.getByRole("button", { name: "Use Signal preset" }).click();
  const trigger = page.getByRole("button", { name: "Open Flowchart focus mode" });
  await trigger.click();
  const focus = page.getByRole("dialog", { name: "Flowchart focus mode" });
  await expect(focus).toBeVisible();
  const source = focus.getByRole("textbox", { name: "Diagram source" });
  await source.fill("flowchart LR\n A[Custom diagram] --> B[Ready]");
  await expect(focus.getByRole("img", { name: /Flowchart preview/ })).toContainText("Custom diagram");
  await focus.getByRole("button", { name: "Copy SVG", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toMatch(/Custom[\s\S]*diagram/);
  const link = focus.getByRole("link", { name: /Open in Mermaid Live/ });
  const data = JSON.parse(Buffer.from(new URL((await link.getAttribute("href"))!).hash.slice(8), "base64url").toString());
  expect(data.code).toContain("Custom diagram");
  await source.fill("flowchart LR\n A[Broken");
  await expect(focus.getByRole("alert")).toBeVisible();
  await expect(focus.getByRole("button", { name: "Copy SVG", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape");
  await trigger.click();
  await expect(source).toHaveValue("flowchart LR\n A[Broken");
  await focus.getByRole("button", { name: "Reset this diagram", exact: true }).click();
  await expect(source).toHaveValue(/Add tokens/);
  await expect(focus.getByRole("img", { name: /Flowchart preview/ })).toContainText("Add tokens");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.locator(".diagram-body svg")).toHaveCount(4);
  expect(problems).toEqual([]);
});

test("focus annotations anchor actual elements on every diagram and surface", async ({ page }) => {
  await page.goto("/editor");
  await page.getByRole("button", { name: "Use Forest preset" }).click();
  for (const name of ["Flowchart", "Sequence", "Entity relationship", "Gantt"]) {
    await page.getByRole("button", { name: `Open ${name} focus mode` }).click();
    const focus = page.getByRole("dialog", { name: `${name} focus mode` });
    await expect(focus.locator(".contrast-leader").first()).toBeVisible();
    expect(await focus.locator(".contrast-leader").count()).toBeGreaterThan(1);
    for (const surface of ["Paper", "Ink", "Brand"]) {
      await focus.getByText(surface, { exact: true }).click();
      await expect(focus.getByRole("radio", { name: surface, exact: true })).toBeChecked();
      await expect(focus.locator(".contrast-leader").first()).toBeVisible();
      expect(await focus.locator(".contrast-leader").evaluateAll((lines) => lines.every((line) => {
        const points = (line.getAttribute("points") ?? "").split(" ").map((point) => point.split(",").map(Number));
        return points.slice(1).every(([x,y], i) => Math.abs(y-points[i][1]) < .1 || Math.abs(Math.abs(x-points[i][0])-Math.abs(y-points[i][1])) < .1);
      }))).toBe(true);
    }
    await focus.getByRole("switch", { name: "Show contrast" }).click();
    await expect(focus.locator(".contrast-leader")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await page.getByRole("switch", { name: "Show contrast" }).check();
  }
});


test("rapid source edits settle on the newest text and reset stays local", async ({ page }) => {
  await page.goto("/editor");
  await page.getByRole("button", { name: "Use Signal preset" }).click();
  await page.getByRole("button", { name: "Open Sequence focus mode" }).click();
  let focus = page.getByRole("dialog", { name: "Sequence focus mode" });
  await focus.getByRole("textbox", { name: "Diagram source" }).fill("sequenceDiagram\nAlice->>Bob: Preserve me");
  await expect(focus.getByRole("img", { name: /Sequence preview/ })).toContainText("Preserve me");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Open Flowchart focus mode" }).click();
  focus = page.getByRole("dialog", { name: "Flowchart focus mode" });
  const source = focus.getByRole("textbox", { name: "Diagram source" });
  await source.fill("flowchart LR\nA[Old edit]-->B");
  await source.fill("flowchart LR\nA[Newest edit]-->B");
  await expect(focus.getByRole("img", { name: /Flowchart preview/ })).toContainText("Newest edit");
  await focus.getByRole("button", { name: "Reset this diagram", exact: true }).click();
  await expect(focus.getByRole("img", { name: /Flowchart preview/ })).toContainText("Add tokens");
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-diagram="sequence"] .diagram-svg')).toContainText("Preserve me");
});
