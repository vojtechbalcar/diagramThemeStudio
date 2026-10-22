"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/system/button";
import { SystemBand } from "@/components/system/system-band";
import { Band } from "@/components/system/band";
import { createEditorSet } from "@/lib/state/editor";
import type { Token, TokenSet } from "@/lib/model";
import { TokenPanel } from "./token-panel";
import { MappingPanel } from "./mapping-panel";
import { ImportDialog } from "./import-dialog";
import { EditorDialog } from "./editor-dialog";
import { Canvas } from "./canvas";
import { ColourStrip } from "./colour-strip";
import { usePreview } from "./use-preview";
import { ExportDrawer } from "./export-drawer";
import { shareUrl } from "@/lib/state/url";
import { useEditorState } from "./use-editor-state";

export function Editor() {
  const [selected, setSelected] = useState<string | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [showContrast, setShowContrast] = useState(true);
  const [toast, setToast] = useState("");
  const onRestore = useCallback(() => setSelected(null), []);
  const [set, dispatch] = useEditorState(setToast, onRestore);
  const latestSet = useRef(set);
  const active = useRef(true);
  useLayoutEffect(() => { latestSet.current = set; active.current = true; return () => { active.current = false; }; }, [set]);
  const [sharing, setSharing] = useState(false);
  const preview = usePreview(set);
  const onToken = useCallback((token: Token) => dispatch({ type: "token", token }), [dispatch]);
  const replace = useCallback((next: TokenSet) => { dispatch({ type: "replace", set: next }); setSelected(null); }, [dispatch]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 4000); return () => clearTimeout(timer); }, [toast]);

  const panels = <>
    <TokenPanel set={set} selected={selected} onSelect={setSelected} onToken={onToken} onReplace={replace} onName={(name) => dispatch({ type: "name", name })} />
    <MappingPanel set={set} checks={preview.checks} onMap={(role, tokenId) => dispatch({ type: "map", role, tokenId })} onAutomap={() => dispatch({ type: "automap" })} />
  </>;
  return <div className="editor-shell">
    <SystemBand subtitle={<span className="hidden md:inline">{set.name || "Untitled set"}</span>}>
      <span className="lg:hidden"><EditorDialog title="Tokens and mapping" description="Edit tokens and assign them to diagram roles." drawer open={drawer} onOpenChange={setDrawer} trigger={<Button variant="text">Tokens</Button>}>
        <div className="flex h-12 items-center border-b border-rule px-4 md:hidden"><ImportDialog onImport={(tokens) => replace(createEditorSet(tokens))} /></div>{panels}
      </EditorDialog></span>
      <span className="hidden md:inline-flex"><ImportDialog onImport={(tokens) => replace(createEditorSet(tokens))} /></span>
      <Button variant="text" className="hidden md:inline-flex" disabled={!set.tokens.length || sharing} onClick={async () => {
        setSharing(true);
        try {
          const url = await shareUrl(set, window.location.href);
          if (!active.current) return;
          if (latestSet.current !== set) { setToast("The set changed. Copy the share link again."); return; }
          await navigator.clipboard.writeText(url);
          setToast("Share link copied.");
        }
        catch (error) { setToast(error instanceof Error ? `Could not copy the share link. ${error.message}` : "Could not copy. Open Export and copy the share link manually."); }
        finally { setSharing(false); }
      }}>Share link</Button>
      <ExportDrawer set={set} checks={preview.checks} checking={preview.pending} unavailable={Boolean(preview.error) || Object.values(preview.result?.diagrams ?? {}).some((diagram) => !diagram.ok)} notify={setToast} />
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
