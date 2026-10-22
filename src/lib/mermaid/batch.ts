import { mermaidConfig, type MermaidConfig, type ThemeVariables } from "@/lib/theme/build-theme";
import { DIAGRAMS, type DiagramKind } from "@/lib/theme/diagrams";
import { SAMPLES } from "./samples";
import { validateSource } from "./source";

export type DiagramResult = { ok: true; svg: string } | { ok: false; error: string };
export type BatchResult = { diagrams: Record<DiagramKind, DiagramResult>; variables: Record<string, string> };

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
      for (const diagram of DIAGRAMS) {
        if (signal?.aborted) return null;
        try {
          const problem = validateSource(diagram.kind, sources[diagram.kind]);
          if (problem) throw new Error(problem);
          const { svg } = await engine.render(`lw-${session}-${++nextId}`, sources[diagram.kind]);
          entries.push([diagram.kind, { ok: true, svg }]);
        } catch (error) {
          entries.push([diagram.kind, { ok: false, error: error instanceof Error ? error.message : "This diagram could not be rendered. Reset it to try again." }]);
        }
      }
      if (signal?.aborted) return null;
      // Entries are built from every member of the fixed diagram registry.
      const diagrams = Object.fromEntries(entries) as Record<DiagramKind, DiagramResult>;
      return { diagrams, variables: colours };
    };
    const result = queue.then(run, run);
    queue = result.catch(() => undefined);
    return result;
  };
}
