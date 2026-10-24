"use client";

import { useId, useState } from "react";
import { Band } from "@/components/system/band";
import { Bullet } from "@/components/system/bullet";
import { Button } from "@/components/system/button";
import { VerdictSymbol } from "@/components/system/verdict-symbol";
import type { Role, TokenSet } from "@/lib/model";
import { worstCheck, type PairCheck } from "@/lib/contrast/check";
import { ROLE_DEFINITIONS, pairsForRole } from "@/lib/theme/roles";

export function MappingPanel({ set, checks, onMap, onAutomap }: {
  set: TokenSet; checks: readonly PairCheck[]; onMap: (role: Role, tokenId: string) => void; onAutomap: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const id = useId();
  return <section aria-label="Mapping">
    <Band title={<button type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)}>Mapping</button>}>
      <Button variant="text" onClick={onAutomap} disabled={!set.tokens.length}>Auto-map</Button>
    </Band>
    {expanded ? <div id={id}>
      {ROLE_DEFINITIONS.map((definition) => {
        const entry = set.mapping[definition.role];
        const selected = set.tokens.find((token) => token.id === entry?.tokenId);
        const pairIds = pairsForRole(definition.role).map((pair) => pair.id);
        const applicable = checks.filter((check) => pairIds.includes(check.pair.id));
        const worst = worstCheck(applicable);
        return <div key={definition.role} className="mapping-row border-b border-rule px-4 py-2">
          <label className="type-body" htmlFor={`${id}-${definition.role}`}>{definition.label}</label>
          <div className="flex min-w-0 items-center gap-2">
            {selected?.type === "color" ? <Bullet kind="token" size="small" glyph={definition.glyph} color={selected.value} label={`${definition.label}, ${selected.value}`} /> : null}
            <select className="editor-select min-w-0 flex-1" id={`${id}-${definition.role}`} value={entry?.tokenId ?? ""} onChange={(event) => onMap(definition.role, event.target.value)}>
              <option value="">Derived</option>
              {set.tokens.filter((token) => token.type === definition.tokenType).map((token) => <option key={token.id} value={token.id}>{token.path}</option>)}
            </select>
            {worst ? <VerdictSymbol verdict={worst.outcome === "pass" && worst.verdict === "large" ? "aa" : worst.verdict} className="shrink-0" /> : null}
          </div>
          {entry?.auto ? <button type="button" onClick={() => onMap(definition.role, entry.tokenId)} className="col-start-2 flex min-h-6 items-center gap-2 text-left type-micro text-muted hover:underline"><span className="auto-dot" aria-hidden="true" />Confirm auto-map</button> : null}
        </div>;
      })}
    </div> : null}
  </section>;
}
