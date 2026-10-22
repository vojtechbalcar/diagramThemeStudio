import { describe, expect, it } from "vitest";
import { validateSource, leaderPoints, scopeSvg } from "@/lib/mermaid/source";
import { SAMPLES } from "@/lib/mermaid/samples";
import { DIAGRAMS } from "@/lib/theme/diagrams";

describe("editable diagram sources", () => {
  it("accepts all samples and matching custom diagrams", () => {
    for (const { kind } of DIAGRAMS) expect(validateSource(kind, SAMPLES[kind])).toBeNull();
    expect(validateSource("flowchart", "%% a comment\ngraph TD\n A[Custom] --> B[Done]")).toBeNull();
  });
  it("rejects empty, oversized and mismatched sources with recovery guidance", () => {
    expect(validateSource("flowchart", "")).toMatch(/Enter a flowchart/i);
    expect(validateSource("flowchart", "x".repeat(30_001))).toMatch(/30,000/);
    expect(validateSource("sequence", "flowchart LR\nA-->B")).toMatch(/sequenceDiagram/);
  });
  it("keeps theme settings and injected interactions outside source editing", () => {
    for (const text of ['%%{init: {"securityLevel":"loose"}}%%\nflowchart LR\nA-->B', '---\nconfig:\n theme: dark\n---\nflowchart LR\nA-->B', 'flowchart LR\n A-->B\n classDef default fill:red', 'flowchart LR\n A-->B\n click A "https://example.com"', 'flowchart LR\n A-->B\n style A fill:red']) {
      expect(validateSource("flowchart", text)).toMatch(/tokens|configuration|interactions/i);
    }
  });
  it("rejects sequence-only colour overrides and actor links", () => {
    for (const source of ["sequenceDiagram\nrect rgb(200,0,0)\nA->>B:Hello\nend", "sequenceDiagram\nbox red Team\nparticipant A\nend", "sequenceDiagram\nlink A: Site@https://example.com", 'sequenceDiagram\nlinks A: {"Site":"https://example.com"}']) {
      expect(validateSource("sequence", source)).toMatch(/tokens|interactions/);
    }
  });
  it("scopes repeated SVG identifiers including CSS and marker references", () => {
    const input = '<svg id="lw-1"><style>#lw-1 .node {fill:red}</style><defs><marker id="arrow"/></defs><path marker-end="url(#arrow)"/><a href="#arrow"/></svg>';
    const output = scopeSvg(input, "focus");
    expect(output).toContain('id="focus-lw-1"');
    expect(output).toContain('#focus-lw-1 .node');
    expect(output).toContain('url(#focus-arrow)');
    expect(output).toContain('href="#focus-arrow"');
  });
  it("routes leader segments only horizontally or at 45 degrees", () => {
    for (const end of [{ x: 400, y: 100 }, { x: 120, y: 360 }, { x: 600, y: 20 }]) {
      const points = leaderPoints({ x: 80, y: 120 }, end);
      expect(points[0]).toEqual({ x: 80, y: 120 });
      expect(points.at(-1)).toEqual(end);
      for (let i = 1; i < points.length; i++) {
        const dx = Math.abs(points[i].x - points[i - 1].x), dy = Math.abs(points[i].y - points[i - 1].y);
        expect(dy === 0 || Math.abs(dx - dy) < 0.001).toBe(true);
      }
    }
  });
});
