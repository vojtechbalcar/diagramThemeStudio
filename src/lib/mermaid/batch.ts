import { mermaidConfig, type MermaidConfig, type ThemeVariables } from "@/lib/theme/build-theme";
import { ALL_DIAGRAM_KINDS, type DiagramKind } from "@/lib/theme/diagrams";
import { SAMPLES } from "./samples";
import { validateSource } from "./source";

export type DiagramResult = { ok: true; svg: string } | { ok: false; error: string };
export type BatchResult = { diagrams: Partial<Record<DiagramKind, DiagramResult>>; variables: Record<string, string> };

/** Small boundary lets queue behaviour be tested without pretending to render SVG in Node. */
export type MermaidEngine = {
  initialize: (config: MermaidConfig) => void;
  render: (id: string, source: string) => Promise<{ svg: string }>;
  getThemeVariables: () => unknown;
};

let nextId = 0;
const session = Date.now().toString(36);

export function createBatchRenderer(engine: MermaidEngine) {
  let queue: Promise<unknown> = Promise.resolve();
  return function renderBatch(
    variables: ThemeVariables,
    sources: Readonly<Record<DiagramKind, string>> = SAMPLES,
    signal?: AbortSignal,
    kinds: readonly DiagramKind[] = ALL_DIAGRAM_KINDS,
  ): Promise<BatchResult | null> {
    const run = async (): Promise<BatchResult | null> => {
      if (signal?.aborted) return null;
      engine.initialize(mermaidConfig(variables));
      const resolved: unknown = engine.getThemeVariables();
      const colours: Record<string, string> = {};
      if (typeof resolved === "object" && resolved !== null) {
        for (const [key, value] of Object.entries(resolved)) {
          if (typeof value === "string") colours[key] = value;
        }
      }
      const entries: Array<[DiagramKind, DiagramResult]> = [];
      for (const kind of kinds) {
        if (signal?.aborted) return null;
        try {
          const problem = validateSource(kind, sources[kind]);
          if (problem) throw new Error(problem);
          const { svg } = await engine.render(`lw-${session}-${++nextId}`, sources[kind]);
          entries.push([kind, { ok: true, svg }]);
        } catch (error) {
          entries.push([kind, { ok: false, error: error instanceof Error ? error.message : "This diagram could not be rendered. Reset it to try again." }]);
        }
      }
      if (signal?.aborted) return null;
      const diagrams: Partial<Record<DiagramKind, DiagramResult>> = Object.fromEntries(entries);
      return { diagrams, variables: colours };
    };
    const result = queue.then(run, run);
    queue = result.catch(() => undefined);
    return result;
  };
}
