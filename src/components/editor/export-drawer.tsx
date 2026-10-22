"use client";

import { useState } from "react";
import { Button } from "@/components/system/button";
import { EditorDialog } from "./editor-dialog";
import { ExportPanel, type ExportPanelProps } from "./export-panel";

export function ExportDrawer(props: ExportPanelProps) {
  const [open, setOpen] = useState(false);
  return <EditorDialog title="Export" description="Copy a Mermaid theme configuration or a link to this token set." open={open} onOpenChange={setOpen} drawer="right"
    trigger={<Button arrow disabled={!props.set.tokens.length} className="export-trigger hidden md:inline-flex" aria-label="Export"><span>Export</span></Button>}>
    <ExportPanel {...props} active={open} />
  </EditorDialog>;
}
