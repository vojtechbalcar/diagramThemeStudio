import { describe, expect, it } from "vitest";
import { createBatchRenderer, type MermaidEngine } from "@/lib/mermaid/batch";
import { SAMPLES } from "@/lib/mermaid/samples";
import { DIAGRAMS } from "@/lib/theme/diagrams";

function engine() {
  const events: string[] = [];
  let active = 0;
  let maximum = 0;
  let colour = "";
  const ids = new Set<string>();
  const api: MermaidEngine = {
    initialize(config) { colour = config.themeVariables.primaryColor ?? ""; events.push(`init:${colour}`); },
    getThemeVariables() { return { mainBkg: colour, nodeTextColor: "#111111", ignored: 12 }; },
    async render(id, source) {
      active++;
      maximum = Math.max(maximum, active);
      expect(ids.has(id)).toBe(false);
      ids.add(id);
      events.push(`render:${colour}`);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active--;
      if (source === "broken") throw new Error("Invalid diagram");
      return { svg: `<svg>${colour}</svg>` };
    },
  };
  return { api, events, maximum: () => maximum };
}

describe("Mermaid batches", () => {
  it("serialises entire theme batches and gives every render a unique id", async () => {
    const fake = engine();
    const render = createBatchRenderer(fake.api);
    const [first, second] = await Promise.all([render({ primaryColor: "#FFFFFF" }), render({ primaryColor: "#222222" })]);
    expect(fake.maximum()).toBe(1);
    expect(fake.events).toEqual(["init:#FFFFFF", ...Array(4).fill("render:#FFFFFF"), "init:#222222", ...Array(4).fill("render:#222222")]);
    expect(first?.variables.mainBkg).toBe("#FFFFFF");
    expect(second?.variables.mainBkg).toBe("#222222");
    expect(second?.variables.ignored).toBeUndefined();
  });

  it("keeps a diagram error local and can render another batch afterwards", async () => {
    const fake = engine();
    const render = createBatchRenderer(fake.api);
    const result = await render({}, { ...SAMPLES, sequence: "broken" });
    expect(result?.diagrams.sequence).toEqual({ ok: false, error: "Invalid diagram" });
    expect(result?.diagrams.flowchart.ok).toBe(true);
    expect((await render({}))?.diagrams.sequence.ok).toBe(true);
  });

  it("skips cancelled queued batches and discards results cancelled during rendering", async () => {
    const fake = engine();
    const render = createBatchRenderer(fake.api);
    const first = new AbortController();
    const queued = new AbortController();
    const job = render({}, SAMPLES, first.signal);
    const skipped = render({}, SAMPLES, queued.signal);
    queued.abort();
    setTimeout(() => first.abort(), 0);
    expect(await job).toBeNull();
    expect(await skipped).toBeNull();
    expect(fake.events.filter((event) => event.startsWith("init"))).toHaveLength(1);
  });

  it("provides all four fixed sample types", () => {
    expect(Object.keys(SAMPLES)).toEqual(DIAGRAMS.map((diagram) => diagram.kind));
  });
});
