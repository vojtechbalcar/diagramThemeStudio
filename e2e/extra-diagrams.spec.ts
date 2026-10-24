import { expect, test } from "@playwright/test";
import { DIAGRAMS } from "../src/lib/theme/diagrams";
import { contrastRatio, formatRatio } from "../src/lib/contrast/wcag";
import { composite, normaliseCssColour } from "../src/lib/tokens/colour";

for (const name of ["State", "Class"]) {
  test(`${name} renders, checks actual colours on every surface and supports focus editing`, async ({ page }, testInfo) => {
    const state = name === "State";
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
      const colors = await focus.locator(".focus-picture svg").evaluate((svg, state) => {
        const node = [...svg.querySelectorAll(".node")].find((element) => element.textContent?.includes(state ? "Draft" : "Token") && element.querySelector("rect"));
        const text = node?.querySelector("text"), fill = node?.querySelector("rect");
        if (!text || !fill) throw new Error("Node text/fill not found");
        const note = [...svg.querySelectorAll(".node")].find((element) => element.textContent?.includes(state ? "Refine" : "A reusable"));
        const noteText = note?.querySelector("text"), noteFill = note?.querySelector("rect, path, polygon");
        if (!noteText || !noteFill) throw new Error("Note text/fill not found");
        const transition = svg.querySelector(".edgeLabel text"), background = svg.querySelector(".edgeLabel rect");
        if (!transition || !background) throw new Error("Transition text/fill not found");
        return { noteText: getComputedStyle(noteText).fill, noteFill: getComputedStyle(noteFill).fill, text: getComputedStyle(text).fill, fill: getComputedStyle(fill).fill, transitionText: getComputedStyle(transition).fill, transitionFill: getComputedStyle(background).fill, opacity: Number(getComputedStyle(background).opacity), surface: getComputedStyle(svg.closest(".focus-proof")!).backgroundColor };
      }, state);
      const text = normaliseCssColour(colors.text)!, fill = normaliseCssColour(colors.fill)!;
      await expect(focus.getByRole("region", { name: `${name} focus contrast` }).getByText(state ? "State text on state fill" : "Class text on class fill", { exact: true }).locator("..")).toContainText(formatRatio(contrastRatio(text.hex, fill.hex)));
      await expect(focus.getByRole("region", { name: `${name} focus contrast` }).getByText(state ? "Transition text on label fill" : "Relationship text on label fill", { exact: true }).locator("..")).toContainText(formatRatio(contrastRatio(normaliseCssColour(colors.transitionText)!.hex, composite(normaliseCssColour(colors.transitionFill)!.hex, colors.opacity, normaliseCssColour(colors.surface)!.hex))));
      await expect(focus.getByRole("list", { name: "Contrast annotations" }).getByText(state ? "State text" : "Class text", { exact: true })).toBeVisible();
      await expect(focus.getByRole("region", { name: `${name} focus contrast` }).getByText(state ? "Note text on note fill" : "Class note text on note fill", { exact: true }).locator("..")).toContainText(formatRatio(contrastRatio(normaliseCssColour(colors.noteText)!.hex, normaliseCssColour(colors.noteFill)!.hex)));
      await expect(focus.getByRole("list", { name: "Contrast annotations" }).getByText("Note text", { exact: true })).toBeVisible();
    }
    await page.screenshot({ path: testInfo.outputPath(`${name.toLowerCase()}-focus.png`) });
    const source = focus.getByRole("textbox", { name: "Diagram source" });
    const original = await source.inputValue();
    await source.fill(original.replaceAll(state ? "Draft" : "Token", "CustomNode"));
    await expect(focus.getByRole("img", { name: new RegExp(`${name} preview`) })).toContainText("CustomNode");
    await source.fill("flowchart LR\n A-->B");
    await expect(focus.getByRole("alert")).toContainText(state ? "stateDiagram-v2" : "classDiagram");
    await source.fill(state ? "stateDiagram-v2 style Draft fill:red\nDraft --> Ready" : "classDiagram style Token fill:red\nclass Token");
    await expect(focus.getByRole("alert")).toContainText("Use tokens");
    await source.fill(state ? "stateDiagram-v2\nDraft --> Ready style Ready fill:red" : "classDiagram\nclass Token style Token fill:red");
    await expect(focus.getByRole("alert")).toContainText("Use tokens");
    await focus.getByRole("button", { name: "Reset this diagram" }).click();
    await expect(source).toHaveValue(original);
    await expect(focus.getByRole("link", { name: /Open in Mermaid Live/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    expect(problems).toEqual([]);
  });
}

test("Pie proofs all slice colours against each surface and keeps exports consistent", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/editor");
  await page.getByRole("button", { name: "Use Night preset" }).click();
  await expect(page.locator(".diagram-body svg")).toHaveCount(DIAGRAMS.length);
  await page.getByRole("button", { name: "Open Pie focus mode" }).click();
  const focus = page.getByRole("dialog", { name: "Pie focus mode" });
  for (const surface of ["Paper", "Ink", "Brand"]) {
    await focus.getByRole("group", { name: "Preview surface" }).getByText(surface, { exact: true }).click();
    await expect(focus.locator(".focus-scroll")).toHaveAttribute("aria-busy", "false");
    const colors = await focus.locator(".focus-picture svg").evaluate(svg => ({
      surface: getComputedStyle(svg.closest(".focus-proof")!).backgroundColor,
      slices: [...svg.querySelectorAll(".pieCircle")].map((path, i) => ({ fill: getComputedStyle(path).fill, opacity: Number(getComputedStyle(path).opacity), text: getComputedStyle(svg.querySelectorAll(".slice")[i]).fill })),
      title: getComputedStyle(svg.querySelector(".pieTitleText")!).fill,
      legend: getComputedStyle(svg.querySelector(".legend text")!).fill,
    }));
    expect(colors.slices).toHaveLength(3);
    for (const [i, slice] of colors.slices.entries()) {
      expect(slice.opacity).toBe(0.7);
      const ratio = contrastRatio(normaliseCssColour(slice.text)!.hex, composite(normaliseCssColour(slice.fill)!.hex, slice.opacity, normaliseCssColour(colors.surface)!.hex));
      await expect(focus.getByText(`Percentage text on slice ${i + 1}`, { exact: true }).locator("..")).toContainText(formatRatio(ratio));
      await expect(focus.getByRole("list", { name: "Contrast annotations" }).getByText(`Slice ${i + 1} text`, { exact: true })).toBeVisible();
    }
    for (const [label, color] of [["Pie title on background", colors.title], ["Legend text on background", colors.legend]]) {
      await expect(focus.getByText(label, { exact: true }).locator("..")).toContainText(formatRatio(contrastRatio(normaliseCssColour(color)!.hex, normaliseCssColour(colors.surface)!.hex)));
    }
  }
  await page.screenshot({ path: testInfo.outputPath("pie-focus.png") });
  const source = focus.getByRole("textbox", { name: "Diagram source" });
  const original = await source.inputValue();
  await source.fill(original.replace("Tokens", "Custom slice"));
  await expect(focus.getByRole("img", { name: /Pie preview/ })).toContainText("Custom slice");
  const live = await focus.getByRole("link", { name: /Open in Mermaid Live/ }).getAttribute("href");
  const state = JSON.parse(Buffer.from(live!.split("#base64:")[1], "base64").toString("utf8"));
  expect(state.code).toContain("Custom slice");
  const config = JSON.parse(state.mermaid);
  expect(config.htmlLabels).toBe(false);
  expect(config.themeVariables.pie1).toBe(config.themeVariables.primaryColor);
  expect(config.themeVariables.pie2).toBe(config.themeVariables.secondaryColor);
  expect(config.themeVariables.pie3).toBe(config.themeVariables.tertiaryColor);
  await source.fill("flowchart LR\nA-->B");
  await expect(focus.getByRole("alert")).toContainText("pie");
  await focus.getByRole("button", { name: "Reset this diagram" }).click();
  await expect(source).toHaveValue(original);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open Pie focus mode" })).toBeFocused();
});

test("Timeline checks actual section, task and event colours and exports the same settings", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/editor");
  await page.getByRole("button", { name: "Use Night preset" }).click();
  await expect(page.locator(".diagram-body svg")).toHaveCount(DIAGRAMS.length);
  await page.getByRole("button", { name: "Open Timeline focus mode" }).click();
  const focus = page.getByRole("dialog", { name: "Timeline focus mode" });
  for (const surface of ["Paper", "Ink", "Brand"]) {
    await focus.getByRole("group", { name: "Preview surface" }).getByText(surface, { exact: true }).click();
    await expect(focus.locator(".focus-scroll")).toHaveAttribute("aria-busy", "false");
    const colors = await focus.locator(".focus-picture svg").evaluate(svg => ({
      surface: getComputedStyle(svg.closest(".focus-proof")!).backgroundColor,
      groups: [0, 1, 2].map(i => [...svg.querySelectorAll(`.timeline-node.section-${i - 1}`)].map(node => ({
        fill: getComputedStyle(node.querySelector("path, rect, circle")!).fill,
        text: getComputedStyle(node.querySelector("text")!).fill,
        filter: node.closest(".eventWrapper") ? getComputedStyle(node.closest(".eventWrapper")!).filter : "none",
      }))),
      title: getComputedStyle(svg.querySelector(":scope > text")!).fill,
    }));
    for (const [i, nodes] of colors.groups.entries()) {
      expect(nodes.length).toBeGreaterThanOrEqual(3);
      for (const node of nodes) {
        expect(node.filter).toBe("none");
        const ratio = contrastRatio(normaliseCssColour(node.text)!.hex, normaliseCssColour(node.fill)!.hex);
        await expect(focus.getByText(`Group ${i + 1} text on group fill`, { exact: true }).locator("..")).toContainText(formatRatio(ratio));
      }
      await expect(focus.getByRole("list", { name: "Contrast annotations" }).getByText(`Group ${i + 1} text`, { exact: true })).toBeVisible();
    }
    await expect(focus.getByText("Timeline title on background", { exact: true }).locator("..")).toContainText(formatRatio(contrastRatio(normaliseCssColour(colors.title)!.hex, normaliseCssColour(colors.surface)!.hex)));
  }
  await page.screenshot({ path: testInfo.outputPath("timeline-focus.png") });
  const source = focus.getByRole("textbox", { name: "Diagram source" });
  const original = await source.inputValue();
  await source.fill(original.replace("Add tokens", "Custom event"));
  await expect(focus.getByRole("img", { name: /Timeline preview/ })).toContainText("Custom event");
  const live = await focus.getByRole("link", { name: /Open in Mermaid Live/ }).getAttribute("href");
  const state = JSON.parse(Buffer.from(live!.split("#base64:")[1], "base64").toString("utf8"));
  const config = JSON.parse(state.mermaid);
  expect(config.htmlLabels).toBe(false);
  expect(config.themeCSS).toContain("filter: none");
  expect(config.themeVariables.cScale1).toBe(config.themeVariables.secondaryColor);
  expect(config.themeVariables.cScaleLabel1).toBe(config.themeVariables.primaryTextColor);
  await source.fill("flowchart LR\nA-->B");
  await expect(focus.getByRole("alert")).toContainText("timeline");
  await focus.getByRole("button", { name: "Reset this diagram" }).click();
  await expect(source).toHaveValue(original);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open Timeline focus mode" })).toBeFocused();
});

for (const mode of ["light", "dark"] as const) {
  test(`new diagrams support phone focus, keyboard return and SVG copy in ${mode}`, async ({ page, context }, testInfo) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const problems: string[] = [];
    page.on("pageerror", error => problems.push(error.message));
    page.on("console", message => { if (message.type() === "error") problems.push(message.text()); });
    await page.setViewportSize({ width: 320, height: 740 });
    await page.emulateMedia({ colorScheme: mode, reducedMotion: "reduce" });
    await page.goto("/editor");
    const views = page.getByRole("group", { name: "Editor view" });
    await views.getByText("Tokens", { exact: true }).click();
    await page.getByRole("button", { name: "Use Signal preset" }).click();
    await views.getByText("Canvas", { exact: true }).click();
    await expect(page.locator(".diagram-body svg")).toHaveCount(DIAGRAMS.length);
    for (const name of ["State", "Class", "Pie", "Timeline"]) {
      const trigger = page.getByRole("button", { name: `Open ${name} focus mode` });
      await trigger.focus();
      await page.keyboard.press("Enter");
      const focus = page.getByRole("dialog", { name: `${name} focus mode` });
      await expect(focus.getByRole("textbox", { name: "Diagram source" })).toBeVisible();
      await expect(focus.getByRole("img", { name: new RegExp(`${name} preview`) })).toBeVisible();
      await focus.getByRole("button", { name: "Copy SVG", exact: true }).click();
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("<svg");
      if (name === "Timeline") await page.screenshot({ path: testInfo.outputPath(`timeline-phone-${mode}.png`) });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
    }
    expect(problems).toEqual([]);
  });
}
