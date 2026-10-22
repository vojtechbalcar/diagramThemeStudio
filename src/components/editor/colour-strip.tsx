"use client";

import { higherContrast } from "@/lib/contrast/wcag";
import { composite } from "@/lib/tokens/colour";
import { INK, PAPER } from "@/lib/theme/build-theme";
import type { Token } from "@/lib/model";

export function ColourStrip({ tokens, selected, surface, onSelect }: { tokens: readonly Token[]; selected: string | null; surface: string; onSelect: (id: string) => void }) {
  const colours = tokens.filter((token) => token.type === "color");
  return <nav aria-label="Colour strip" className="colour-strip">
    {colours.length ? colours.map((token) => {
      const fill = token.alpha === undefined ? token.value : composite(token.value, token.alpha, surface);
      return <button type="button" key={token.id} aria-label={`Select ${token.path}`} aria-pressed={token.id === selected} title={`${token.path}: ${token.value}`} onClick={() => onSelect(token.id)} className="colour-block type-mono-small" style={{ backgroundColor: fill, color: higherContrast(fill, INK, PAPER) }}>
        <span>{token.value}</span>
      </button>;
    }) : <span className="flex items-center px-4 type-small text-muted">Your palette will appear here.</span>}
  </nav>;
}
