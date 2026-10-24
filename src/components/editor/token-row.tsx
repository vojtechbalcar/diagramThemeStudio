"use client";

import { Bullet } from "@/components/system/bullet";
import type { Mapping, Token } from "@/lib/model";
import { glyphFor } from "@/lib/theme/roles";
import { cn } from "@/lib/cn";
import { TokenEditor } from "./token-editor";

export function TokenRow({ token, mapping, selected, onSelect, onChange }: {
  token: Token; mapping: Mapping; selected: boolean; onSelect: () => void; onChange: (token: Token) => void;
}) {
  return <div data-token-id={token.id}>
    <button type="button" aria-label={`Edit ${token.path}`} aria-expanded={selected} onClick={onSelect}
      className={cn("flex h-12 w-full items-center gap-2 border-b border-rule px-4 text-left focus-visible:-outline-offset-4", selected ? "lw-inverted" : "hover:bg-recess")}>
      {token.type === "color" ? <Bullet kind="token" glyph={glyphFor(token.id, mapping) ?? null} color={token.value} label={`${token.path}, ${token.value}`} /> : null}
      <span className="min-w-0 flex-1 truncate type-body" title={token.path}>{token.path}</span>
      <span className="max-w-[128px] shrink-0 truncate type-mono" title={token.value}>{token.value}{token.alpha !== undefined ? <span className="ml-1 type-micro">{Math.round(token.alpha * 100)}%</span> : null}</span>
    </button>
    {selected ? <TokenEditor key={token.id} token={token} onChange={onChange} /> : null}
  </div>;
}
