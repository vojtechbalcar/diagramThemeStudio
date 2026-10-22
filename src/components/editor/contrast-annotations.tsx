"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { DiagramKind } from "@/lib/theme/diagrams";
import type { PairCheck } from "@/lib/contrast/check";
import { formatRatio } from "@/lib/contrast/wcag";
import { leaderPoints, type Point } from "@/lib/mermaid/source";
import { VerdictSymbol } from "@/components/system/verdict-symbol";

const ANCHORS: Record<DiagramKind, Record<string, string>> = {
  flowchart: { "primary-text": ".node .label", "label-text": ".edgeLabel text", "title-text": ".cluster-label", "line-on-background": ".flowchart-link" },
  sequence: { "primary-text": "text.actor", "note-text": ".noteText", "text-on-background": ".messageText", "lifeline-on-background": ".actor-line" },
  er: { "primary-text": ".label.name", "label-text": ".edgeLabel text", "line-on-background": ".relationshipLine", "attribute-odd": ".row-rect-odd", "attribute-even": ".row-rect-even" },
  gantt: { "primary-text": ".taskText", "text-on-background": ".taskTextOutsideRight, .taskTextOutsideLeft", "section-text": ".taskTextOutsideRight, .taskTextOutsideLeft", "section-title": ".sectionTitle" },
};

type Annotation = { check: PairCheck; anchor: Point; end: Point };

export function ContrastAnnotations({ kind, svg, checks, setName, style }: { kind: DiagramKind; svg: string; checks: readonly PairCheck[]; setName: string; style: CSSProperties }) {
  const host = useRef<HTMLDivElement>(null);
  const [measured, setMeasured] = useState<{ svg: string; annotations: Annotation[] } | null>(null);
  useEffect(() => {
    const root = host.current;
    if (!root) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = root.getBoundingClientRect();
        const annotations: Annotation[] = [];
        for (const check of checks) {
          const selector = ANCHORS[kind][check.pair.id];
          const element = selector ? root.querySelector(`.focus-picture ${selector.split(", ").join(", .focus-picture ")}`) : null;
          if (!element) continue;
          const rect = element.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) continue;
          annotations.push({ check, anchor: { x: rect.left - bounds.left + rect.width / 2, y: rect.top - bounds.top + rect.height / 2 }, end: { x: bounds.width - 192, y: 48 + annotations.length * 64 } });
        }
        setMeasured({ svg, annotations });
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    measure();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [svg, checks, kind]);
  const annotations = measured?.svg === svg ? measured.annotations : [];
  return <div ref={host} className={`focus-proof ${checks.length ? "has-annotations" : ""}`} style={style}>
    <div className="focus-picture diagram-svg" role="img" aria-label={`${kind === "er" ? "Entity relationship" : kind[0].toUpperCase() + kind.slice(1)} preview, themed with ${setName || "Untitled set"}`} dangerouslySetInnerHTML={{ __html: svg }} />
    {annotations.length ? <>
      <svg className="contrast-leaders" aria-hidden="true">{annotations.map(({ check, anchor, end }) => <polyline key={check.pair.id} className="contrast-leader" points={leaderPoints(anchor, end).map(({ x, y }) => `${x},${y}`).join(" ")} />)}</svg>
      <ul aria-label="Contrast annotations">{annotations.map(({ check, end }) => <li key={check.pair.id} className="contrast-tile" style={{ top: end.y - 24 }} title={check.pair.name}>
        <span className="flex items-center gap-2"><VerdictSymbol verdict={check.outcome === "pass" ? (check.verdict === "aaa" ? "aaa" : "aa") : check.verdict} /><span>{formatRatio(check.ratio)}</span></span>
        <span>{check.pair.short}</span>
      </li>)}</ul>
    </> : null}
  </div>;
}
