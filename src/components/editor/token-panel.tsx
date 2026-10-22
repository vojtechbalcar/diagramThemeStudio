"use client";

import { Band } from "@/components/system/band";
import { Bullet } from "@/components/system/bullet";
import { Input } from "@/components/system/input";
import { SecondaryBand } from "@/components/system/secondary-band";
import type { Token, TokenSet } from "@/lib/model";
import { PRESETS } from "@/lib/tokens/presets";
import { glyphFor } from "@/lib/theme/roles";
import { describeTokens } from "@/lib/tokens/summary";
import { AddTokenDialog } from "./add-token-dialog";
import { TokenRow } from "./token-row";

export function TokenPanel({ set, selected, onSelect, onToken, onReplace, onName }: {
  set: TokenSet; selected: string | null; onSelect: (id: string | null) => void; onToken: (token: Token) => void;
  onReplace: (set: TokenSet) => void; onName: (name: string) => void;
}) {
  return <section aria-label="Tokens">
    <Band title="Tokens"><span className="type-micro">{set.tokens.length}</span><AddTokenDialog disabled={set.tokens.length >= 1000} onAdd={(token) => { onToken(token); onSelect(token.id); }} /></Band>
    {set.tokens.length >= 1000 ? <p className="p-4 type-small text-muted">Token limit reached (1,000). Import a smaller set to add more.</p> : null}
    <label className="grid gap-2 border-b border-rule p-4 type-small">Set name<Input density="dense" value={set.name} maxLength={80} onChange={(event) => onName(event.target.value)} onBlur={() => { if (!set.name.trim()) onName("Untitled set"); }} /></label>
    {set.tokens.length === 0 ? <div className="p-4"><p className="type-heading">No tokens yet.</p><p className="mt-2 type-small text-muted">Paste a token file or start from a preset.</p></div> : null}
    {([{ type: "color", label: "Colours" }, { type: "fontFamily", label: "Typography" }] as const).map((group) => {
      const tokens = set.tokens.filter((token) => group.type === "color" ? token.type === "color" : token.type !== "color");
      if (!tokens.length) return null;
      return <div key={group.type}><SecondaryBand title={group.label} />{tokens.map((token) => <TokenRow key={token.id} token={token} mapping={set.mapping} selected={selected === token.id} onSelect={() => onSelect(selected === token.id ? null : token.id)} onChange={onToken} />)}</div>;
    })}
    <details className="border-b border-rule" open={set.tokens.length === 0}>
      <summary className="flex h-12 cursor-pointer items-center px-4 type-heading focus-visible:-outline-offset-4">Start from a preset</summary>
      {PRESETS.map((preset) => <button type="button" key={preset.id} aria-label={`Use ${preset.set.name} preset`} onClick={() => onReplace(preset.set)} className="flex min-h-12 w-full items-center gap-3 border-t border-rule px-4 py-3 text-left hover:bg-recess focus-visible:-outline-offset-4">
        <span className="flex gap-1" aria-hidden="true">{preset.set.tokens.filter((token) => token.type === "color").slice(0, 4).map((token) => <Bullet key={token.id} kind="token" size="small" glyph={glyphFor(token.id, preset.set.mapping)} color={token.value} label={token.path} />)}</span>
        <span><span className="block type-small font-bold">{preset.set.name}</span><span className="block type-micro text-muted">{describeTokens(preset.set.tokens)}</span></span>
      </button>)}
    </details>
  </section>;
}
