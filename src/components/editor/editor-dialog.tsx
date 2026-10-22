"use client";

import { Dialog } from "radix-ui";
import type { ReactNode } from "react";
import { Band } from "@/components/system/band";
import { IconButton } from "@/components/system/icon-button";
import { SymbolClose } from "@/components/system/symbol-close";

export function EditorDialog({ title, description, trigger, children, open, onOpenChange, drawer = false }: {
  title: string; description: string; trigger?: ReactNode; children: ReactNode;
  open: boolean; onOpenChange: (open: boolean) => void; drawer?: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Dialog.Trigger asChild>{trigger}</Dialog.Trigger> : null}
      <Dialog.Portal>
        <Dialog.Overlay className="editor-scrim" />
        <Dialog.Content className={drawer ? "editor-dialog editor-drawer" : "editor-dialog"}>
          <Band titleAs="div" title={<Dialog.Title>{title}</Dialog.Title>}>
            <Dialog.Close asChild><IconButton label={`Close ${title.toLowerCase()}`}><SymbolClose /></IconButton></Dialog.Close>
          </Band>
          <Dialog.Description className="sr-only">{description}</Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
