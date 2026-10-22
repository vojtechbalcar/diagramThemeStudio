"use client";

import { Tabs } from "radix-ui";
import { useEffect, useState } from "react";
import { Button } from "@/components/system/button";
import type { TokenSet } from "@/lib/model";
import type { PairCheck } from "@/lib/contrast/check";
import { EXPORT_FORMATS, exportTheme, type ExportFormat } from "@/lib/theme/export";
import { shareUrl } from "@/lib/state/url";
import { EditorDialog } from "./editor-dialog";
import { TitleBlock } from "./title-block";
import { ExportOutput } from "./export-output";

const COPY_MESSAGE = { init: "Copied init directive.", initialize: "Copied mermaid.initialize() config.", json: "Copied JSON.", share: "Share link copied." } as const;
const HELP = {
  init: "Paste above a diagram. For new integrations, Mermaid recommends its configuration API.",
  initialize: "Run before rendering your diagrams.",
  json: "A Mermaid configuration object, ready to use in your integration.",
  share: "Contains your tokens, mappings, name and preview surface. No account needed.",
} as const;

export function ExportDrawer({ set, checks, checking, unavailable, notify }: { set: TokenSet; checks: readonly PairCheck[]; checking: boolean; unavailable: boolean; notify: (message: string) => void }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("init");
  const [shared, setShared] = useState<{ set: TokenSet; value: string; error?: string } | null>(null);
  useEffect(() => {
    if (!open || format !== "share") return;
    let cancelled = false;
    void shareUrl(set, window.location.href).then((value) => { if (!cancelled) setShared({ set, value }); })
      .catch((error: unknown) => { if (!cancelled) setShared({ set, value: "", error: error instanceof Error ? error.message : "The share link could not be created. Try again." }); });
    return () => { cancelled = true; };
  }, [set, format, open]);
  const currentShare = shared?.set === set ? shared : null;
  return <EditorDialog title="Export" description="Copy a Mermaid theme configuration or a link to this token set." open={open} onOpenChange={setOpen} drawer="right"
    trigger={<Button arrow disabled={!set.tokens.length} className="export-trigger" aria-label="Export"><span className="export-trigger-label">Export</span></Button>}>
    <div className="p-6">
      <TitleBlock set={set} checks={checks} checking={checking} unavailable={unavailable} />
      <Tabs.Root value={format} onValueChange={(value) => { if (EXPORT_FORMATS.some((option) => option.value === value)) setFormat(value as ExportFormat); }} className="mt-6">
        <Tabs.List aria-label="Export format" className="export-tabs">
          {EXPORT_FORMATS.map((option) => <Tabs.Trigger key={option.value} value={option.value} className="export-tab">{option.label}</Tabs.Trigger>)}
        </Tabs.List>
        {EXPORT_FORMATS.map((option) => <Tabs.Content key={option.value} value={option.value} className="export-tab-panel">
          <ExportOutput value={option.value === "share" ? currentShare?.value ?? "" : exportTheme(option.value, set)} error={option.value === "share" ? currentShare?.error : undefined} message={COPY_MESSAGE[option.value]} help={HELP[option.value]} notify={notify} />
        </Tabs.Content>)}
      </Tabs.Root>
    </div>
  </EditorDialog>;
}
