import { expect, test } from "@playwright/test";
import { DIAGRAMS } from "../src/lib/theme/diagrams";
import { contrastRatio, formatRatio } from "../src/lib/contrast/wcag";
import { composite, normaliseCssColour } from "../src/lib/tokens/colour";

for (const name of ["State"]) {
  test(`${name} renders, checks actual colours on every surface and supports focus editing`, async ({ page }, testInfo) => {
    const problems: string[] = [];
    page.on("pageerror", (error) => problems.push(error.message));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/editor");
    await page.getByRole("button", { name: "Use Night preset" }).click();
    await expect(page.locator(".diagram-body svg")).toHaveCount(DIAGRAMS.length);
    const trigger = page.getByRole("button", { name: `Open ${name} focus mode` });
    await trigger.click();
    const focus = page.getByRole("dialog", { name: `${name} focus mode` });
    for (const surface of ["Paper", "Ink", "Brand"]) {
      await focus.getByRole("group", { name: "Preview surface" }).getByText(surface, { exact: true }).click();
      await expect(focus.locator(".focus-scroll")).toHaveAttribute("aria-busy", "false");
      await expect(focus.locator(".contrast-leader").first()).toBeVisible();
      const colors = await focus.locator(".focus-picture svg").evaluate((svg) => {
        const node = [...svg.querySelectorAll(".node")].find((element) => element.textContent?.includes("Draft") && element.querySelector("rect.basic"));
        const text = node?.querySelector("text"), fill = node?.querySelector("rect.basic");
        if (!text || !fill) throw new Error("State text/fill not found");
        const transition = svg.querySelector(".edgeLabel text"), background = svg.querySelector(".edgeLabel rect");
        if (!transition || !background) throw new Error("Transition text/fill not found");
        return { text: getComputedStyle(text).fill, fill: getComputedStyle(fill).fill, transitionText: getComputedStyle(transition).fill, transitionFill: getComputedStyle(background).fill, opacity: Number(getComputedStyle(background).opacity), surface: getComputedStyle(svg.closest(".focus-proof")!).backgroundColor };
      });
      const text = normaliseCssColour(colors.text)!, fill = normaliseCssColour(colors.fill)!;
      await expect(focus.getByRole("region", { name: `${name} focus contrast` }).getByText("State text on state fill", { exact: true }).locator("..")).toContainText(formatRatio(contrastRatio(text.hex, fill.hex)));
      await expect(focus.getByRole("region", { name: `${name} focus contrast` }).getByText("Transition text on label fill", { exact: true }).locator("..")).toContainText(formatRatio(contrastRatio(normaliseCssColour(colors.transitionText)!.hex, composite(normaliseCssColour(colors.transitionFill)!.hex, colors.opacity, normaliseCssColour(colors.surface)!.hex))));
      await expect(focus.getByRole("list", { name: "Contrast annotations" }).getByText("State text", { exact: true })).toBeVisible();
    }
    await page.screenshot({ path: testInfo.outputPath(`${name.toLowerCase()}-focus.png`) });
    const source = focus.getByRole("textbox", { name: "Diagram source" });
    const original = await source.inputValue();
    await source.fill(original.replaceAll("Draft", "CustomDraft"));
    await expect(focus.getByRole("img", { name: /State preview/ })).toContainText("CustomDraft");
    await source.fill("flowchart LR\n A-->B");
    await expect(focus.getByRole("alert")).toContainText("stateDiagram-v2");
    await source.fill("stateDiagram-v2 style Draft fill:red\nDraft --> Ready");
    await expect(focus.getByRole("alert")).toContainText("Use tokens");
    await source.fill("stateDiagram-v2\nDraft --> Ready style Ready fill:red");
    await expect(focus.getByRole("alert")).toContainText("Use tokens");
    await focus.getByRole("button", { name: "Reset this diagram" }).click();
    await expect(source).toHaveValue(original);
    await expect(focus.getByRole("link", { name: /Open in Mermaid Live/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    expect(problems).toEqual([]);
  });
}
