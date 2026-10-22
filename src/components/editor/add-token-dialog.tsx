"use client";

import { useId, useState } from "react";
import { Button } from "@/components/system/button";
import { IconButton } from "@/components/system/icon-button";
import { Input } from "@/components/system/input";
import { SymbolPlus } from "@/components/system/symbol-plus";
import type { Token, TokenType } from "@/lib/model";
import { editToken } from "@/lib/state/editor";
import { PAPER } from "@/lib/theme/build-theme";
import { EditorDialog } from "./editor-dialog";

export function AddTokenDialog({ onAdd, disabled = false }: { onAdd: (token: Token) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TokenType>("color");
  const [path, setPath] = useState("");
  const [value, setValue] = useState("");
  const [tried, setTried] = useState(false);
  const id = useId();
  const draft = editToken({ id: "draft", path: "draft", type, value: PAPER, source: "manual" }, value, path);
  return (
    <EditorDialog title="Add token" description="Add a colour, font family or font size to the current set." open={open} onOpenChange={(next) => { setOpen(next); if (next) { setPath(""); setValue(""); setTried(false); } }}
      trigger={<IconButton label="Add token" disabled={disabled}><SymbolPlus /></IconButton>}>
      <form className="grid gap-4 p-6" onSubmit={(event) => { event.preventDefault(); setTried(true); if (draft) { onAdd({ ...draft, id: `manual-${crypto.randomUUID()}` }); setOpen(false); } }}>
        <label className="grid gap-2 type-heading">Token type<select className="editor-select" value={type} onChange={(event) => { const option = event.target.value; if (option === "color" || option === "fontFamily" || option === "dimension") setType(option); }}>
          <option value="color">Colour</option><option value="fontFamily">Font family</option><option value="dimension">Font size</option>
        </select></label>
        <label className="grid gap-2 type-heading" htmlFor={`${id}-path`}>Token path<Input id={`${id}-path`} mono autoFocus required maxLength={300} value={path} onChange={(event) => setPath(event.target.value)} /></label>
        <label className="grid gap-2 type-heading" htmlFor={`${id}-value`}>Token value<Input id={`${id}-value`} mono required maxLength={300} value={value} aria-invalid={tried && !draft} aria-describedby={`${id}-hint`} onChange={(event) => setValue(event.target.value)} /></label>
        <p id={`${id}-hint`} className={tried && !draft ? "type-small text-signal" : "type-small text-muted"}>{type === "color" ? "Use a hex, rgb() or oklch() colour." : type === "dimension" ? "Use a positive px or rem size, such as 14px." : "Use a font family or comma-separated font stack."}</p>
        <Button type="submit">Add token</Button>
      </form>
    </EditorDialog>
  );
}
