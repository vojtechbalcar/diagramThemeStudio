"use client";

import { useEffect, useState, type CSSProperties } from "react";

/** Keep the outgoing render only for the finite, reading-order crossfade. */
export function DiagramPicture({ svg, label, index }: { svg: string; label: string; index: number }) {
  const [frames, setFrames] = useState<{ current: string; previous: string | null }>({ current: svg, previous: null });
  if (frames.current !== svg) setFrames({ current: svg, previous: frames.current });
  useEffect(() => {
    if (!frames.previous) return;
    const current = frames.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => setFrames((value) => value.current === current ? { ...value, previous: null } : value), reduced ? 0 : 160 + (index - 1) * 30);
    return () => clearTimeout(timer);
  }, [frames, index]);
  const style = { "--picture-order": index - 1 } as CSSProperties;
  return <div className="diagram-picture" style={style}>
    <div key={frames.current} className="diagram-svg diagram-picture-current" role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: frames.current }} />
    {frames.previous ? <div key={frames.previous} className="diagram-svg diagram-picture-previous" aria-hidden="true" dangerouslySetInnerHTML={{ __html: frames.previous }} /> : null}
  </div>;
}
