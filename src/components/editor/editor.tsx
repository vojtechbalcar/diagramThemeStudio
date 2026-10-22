"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { Button } from "@/components/system/button";
import { SystemBand } from "@/components/system/system-band";
import { Band } from "@/components/system/band";
import { createEditorSet, editorReducer } from "@/lib/state/editor";
import type { Token, TokenSet } from "@/lib/model";
import { TokenPanel } from "./token-panel";
import { MappingPanel } from "./mapping-panel";
import { ImportDialog } from "./import-dialog";
import { EditorDialog } from "./editor-dialog";
import { Canvas } from "./canvas";
import { ColourStrip } from "./colour-strip";
import { usePreview } from "./use-preview";

export function Editor() {
  const [set, dispatch] = useReducer(editorReducer, undefined, () => createEditorSet());
  const [selected, setSelected] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [showContrast, setShowContrast] = useState(true);
  const [toast, setToast] = useState("");
  const preview = usePreview(set);
  const onToken = useCallback((token: Token) => dispatch({ type: "token", token }), []);
  const replace = useCallback((next: TokenSet) => { dispatch({ type: "replace", set: next }); setSelected(null); }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 4000); return () => clearTimeout(timer); }, [toast]);

  const panels = <>
    <TokenPanel set={set} selected={selected} onSelect={setSelected} onToken={onToken} onReplace={replace} onName={(name) => dispatch({ type: "name", name })} />
    <MappingPanel set={set} checks={preview.checks} onMap={(role, tokenId) => dispatch({ type: "map", role, tokenId })} onAutomap={() => dispatch({ type: "automap" })} />
  </>;
  return <div className="editor-shell">
    <SystemBand subtitle={<span className="hidden md:inline">{set.name || "Untitled set"}</span>}>
      <span className="lg:hidden"><EditorDialog title="Tokens and mapping" description="Edit tokens and assign them to diagram roles." drawer open={drawer} onOpenChange={setDrawer} trigger={<Button variant="text">Tokens</Button>}>{panels}</EditorDialog></span>
      <ImportDialog onImport={(tokens) => replace(createEditorSet(tokens))} />
    </SystemBand>
    <div className="editor-workspace">
      <aside className="editor-sidebar">{panels}</aside>
      <Canvas set={set} {...preview} showContrast={showContrast} onShowContrast={setShowContrast} onSurface={(surface) => dispatch({ type: "surface", surface })} onReset={preview.retry} notify={setToast} />
    </div>
    <ColourStrip tokens={set.tokens} surface={preview.surface} selected={selected} onSelect={(id) => {
      setSelected(id);
      if (window.matchMedia("(max-width: 1023px)").matches) setDrawer(true);
    }} />
    <div aria-live="polite" aria-atomic="true" className="editor-toast">{toast ? <Band titleAs="p" title={<span className="type-small">{toast}</span>} /> : null}</div>
  </div>;
}
