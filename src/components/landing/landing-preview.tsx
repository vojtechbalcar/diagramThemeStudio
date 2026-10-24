"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Button } from "@/components/system/button";
import { ButtonLink } from "@/components/system/button-link";
import { Bullet } from "@/components/system/bullet";
import { useMediaQuery } from "@/components/system/use-media-query";
import { usePreview } from "@/components/editor/use-preview";
import { PRESETS } from "@/lib/tokens/presets";
import { LANDING_DIAGRAMS, LANDING_DIAGRAM_KINDS } from "@/lib/theme/diagrams";
import { checksFor } from "@/lib/contrast/check";
import { higherContrast } from "@/lib/contrast/wcag";
import { INK, PAPER } from "@/lib/theme/build-theme";
import { LandingPanel } from "./landing-panel";

function subscribeVisibility(notify: () => void) {
  document.addEventListener("visibilitychange", notify);
  return () => document.removeEventListener("visibilitychange", notify);
}
const isVisible = () => document.visibilityState !== "hidden";
const serverVisible = () => true;

const STEPS = [
  { number: 1, title: "Add tokens", text: "Paste a token file, import CSS variables or start from a preset." },
  { number: 2, title: "Map roles", text: "Assign your colours, preview four diagrams and check the contrast." },
  { number: 3, title: "Export", text: "Copy a Mermaid configuration or share your complete theme with a link." },
] as const;

export function LandingPreview() {
  const [index, setIndex] = useState(1);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const visible = useSyncExternalStore(subscribeVisibility, isVisible, serverVisible);
  const stopped = paused || hovered || focused || reduced || !visible;
  useEffect(() => {
    if (stopped) return;
    const timer = setInterval(() => setIndex((current) => (current + 1) % PRESETS.length), 3000);
    return () => clearInterval(timer);
  }, [stopped]);
  const preset = PRESETS[index];
  const preview = usePreview(preset.set, undefined, LANDING_DIAGRAM_KINDS);
  const ink = higherContrast(preview.surface, INK, PAPER);
  const style = { backgroundColor: preview.surface, "--lw-ink": ink, "--lw-on-ink": ink === INK ? PAPER : INK, "--lw-focus": ink, color: ink } as CSSProperties;
  return <div className="landing-page">
    <main>
      <div className="landing-hero">
        <section className="landing-intro" aria-labelledby="landing-title">
          <h1 id="landing-title" className="type-title">Diagrams in your brand&rsquo;s colours.</h1>
          <p className="mt-4">Turn design tokens into a Mermaid theme. See every diagram, check the contrast and export a configuration that fits your brand.</p>
          <div className="mt-8"><ButtonLink href="/editor" arrow>Open the editor</ButtonLink></div>
          <p className="mt-4 type-small text-muted">Start without an account. Import, preview and share in your browser.</p>
          <div className="mt-8"><ButtonLink href="/system" variant="text">View the system</ButtonLink></div>
        </section>
        <section className="landing-demo" aria-label="Live theme previews" data-preset={preset.id}
          onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
          onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
          <div className="landing-demo-toolbar"><h2 className="type-heading">One theme. Four diagrams.</h2><Button variant="text" disabled={reduced} aria-pressed={paused} onClick={() => setPaused((current) => !current)}>{paused ? "Resume preview" : "Pause preview"}</Button></div>
          <div className="landing-presets" role="group" aria-label="Preview preset">{PRESETS.map((option, position) => <button type="button" key={option.id} aria-pressed={index === position} className="landing-preset" onClick={() => setIndex(position)}>{option.set.name}</button>)}</div>
          <p className="mt-3 type-small text-muted">{reduced ? "Automatic cycling is off for reduced motion." : stopped ? "Preview paused. Choose a preset to compare." : "Changes preset every 3 seconds. Hover or focus to pause."}</p>
          <div className="landing-diagrams">{LANDING_DIAGRAMS.map((diagram) => <LandingPanel key={diagram.kind} diagram={diagram} result={preview.result?.diagrams[diagram.kind]} checks={checksFor(diagram.kind, preview.checks)} pending={preview.pending} error={preview.error} setName={preset.set.name} style={style} onRetry={preview.retry} />)}</div>
        </section>
      </div>
      <ol className="landing-steps" aria-label="How it works">{STEPS.map((step) => <li key={step.number}>
        <Bullet kind="step" size="large" value={step.number} />
        <div><h2 className="type-heading">{step.title}</h2><p className="mt-2 type-small text-muted">{step.text}</p></div>
      </li>)}</ol>
    </main>
    <footer className="colour-strip landing-palette" aria-label="Current preset palette">{preset.set.tokens.filter((token) => token.type === "color").map((token) => <div key={token.id} className="colour-block type-mono-small" style={{ backgroundColor: token.value, color: higherContrast(token.value, INK, PAPER) }}>
      <span><span className="sr-only">{token.path}: </span>{token.value}</span>
    </div>)}</footer>
  </div>;
}
