"use client";

import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useAccount } from "./account-provider";
import { SignInControl } from "./sign-in-control";
import { Button } from "@/components/system/button";
import { Input } from "@/components/system/input";
import { EditorDialog } from "@/components/editor/editor-dialog";
import type { TokenSet } from "@/lib/model";
import { createSavedSet, rememberSavedSet, savedIdentity, SavedSetRequestError, updateSavedSet } from "@/lib/saved-sets/client";

type Props = { set: TokenSet; notify: (message: string) => void; onName: (name: string) => void; navigation: RefObject<number>; children: ReactNode };
type SaveContextValue = { signedIn: false } | { signedIn: true; pending: boolean; empty: boolean; open: (trigger: HTMLButtonElement) => void };
const SaveContext = createContext<SaveContextValue | null>(null);

/** Every responsive trigger shares a single dialog and in-flight mutation. */
export function SaveSetProvider(props: Props) {
  const { state } = useAccount();
  if (state.status === "ready" && state.account.available && state.account.userId) return <SignedInSave key={state.account.userId} {...props} />;
  return <SaveContext.Provider value={state.status === "ready" && state.account.available ? { signedIn: false } : null}>{props.children}</SaveContext.Provider>;
}

export function SaveSetControl() {
  const save = useContext(SaveContext);
  if (!save) return null;
  if (!save.signedIn) return <SignInControl label="Save" />;
  return <Button variant="text" disabled={save.empty || save.pending} onClick={(event) => save.open(event.currentTarget)}>{save.pending ? "Saving…" : "Save"}</Button>;
}

function SignedInSave({ set, notify, onName, navigation, children }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [identity, setIdentity] = useState<ReturnType<typeof savedIdentity>>(null);
  const [copy, setCopy] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const latestSet = useRef(set);
  const active = useRef(true);
  const submitting = useRef(false);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const openedNavigation = useRef(0);
  useLayoutEffect(() => { latestSet.current = set; }, [set]);
  useEffect(() => {
    active.current = true;
    const closeOnNavigation = () => setOpen(false);
    window.addEventListener("hashchange", closeOnNavigation);
    window.addEventListener("popstate", closeOnNavigation);
    return () => {
      active.current = false;
      window.removeEventListener("hashchange", closeOnNavigation);
      window.removeEventListener("popstate", closeOnNavigation);
    };
  }, []);

  return <SaveContext.Provider value={{ signedIn: true, pending, empty: !set.tokens.length, open: (button) => {
    if (submitting.current) return;
    trigger.current = button;
    openedNavigation.current = navigation.current;
    setName(set.name); setIdentity(savedIdentity(window.location.search)); setCopy(false); setConflict(false); setError(""); setOpen(true);
  } }}>
    {children}
    <EditorDialog title="Save theme" description="Save a private theme to your account, update its saved version or create a copy." open={open} onOpenChange={setOpen} onCloseAutoFocus={(event) => {
      event.preventDefault();
      (trigger.current?.isConnected && !trigger.current.disabled ? trigger.current : document.querySelector<HTMLElement>("#theme-editor-heading"))?.focus();
    }}>
    <form className="p-6" onSubmit={async (event) => {
      event.preventDefault();
      if (openedNavigation.current !== navigation.current) { setOpen(false); return; }
      if (submitting.current || !name.trim() || !set.tokens.length || (conflict && !copy)) return;
      submitting.current = true; setPending(true); setError("");
      const source = set;
      const snapshot = { ...source, name: name.trim() };
      const search = window.location.search;
      const navigated = navigation.current;
      try {
        const saved = identity && !copy ? await updateSavedSet(identity.id, identity.revision, snapshot) : await createSavedSet(snapshot);
        if (!active.current || navigation.current !== navigated || window.location.search !== search) return;
        rememberSavedSet(saved.id, saved.revision);
        if (latestSet.current === source) { if (saved.name !== source.name) onName(saved.name); notify("Theme saved to your account."); }
        else notify("Earlier version saved. Your newer edits are still in the editor; save again to keep them.");
        setOpen(false);
      } catch (error) {
        if (!active.current || navigation.current !== navigated || window.location.search !== search) return;
        const message = error instanceof Error ? error.message : "Could not save this theme. Try again.";
        setError(message);
        if (error instanceof SavedSetRequestError && [404, 409].includes(error.status)) setConflict(true);
        notify(message);
      } finally { submitting.current = false; if (active.current) setPending(false); }
    }}>
      <label htmlFor={`${id}-name`} className="block type-heading">Saved name</label>
      <Input autoFocus id={`${id}-name`} className="mt-3" value={name} maxLength={80} required disabled={pending} onChange={(event) => setName(event.target.value)} />
      <p className="mt-3 type-small text-muted">{identity ? "Update the saved theme or keep the original and save a copy." : "Only you can see this saved theme."} Share links still contain a separate, public copy of the theme.</p>
      {identity ? <label className="mt-4 flex min-h-12 cursor-pointer items-center gap-3 type-body"><input type="checkbox" className="size-4 accent-ink" checked={copy} disabled={pending} onChange={(event) => setCopy(event.target.checked)} />Save a copy</label> : null}
      {error ? <div role="alert" className="mt-4 type-small text-signal"><p>{error}</p>{conflict ? <p className="mt-2">Choose Save a copy to keep your draft, or reopen the latest version from Saved sets.</p> : null}</div> : null}
      <div className="mt-6 flex flex-wrap justify-end gap-2"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={pending || !name.trim() || (conflict && !copy)}>{pending ? "Saving…" : identity && !copy ? "Update set" : "Save set"}</Button></div>
    </form>
    </EditorDialog>
  </SaveContext.Provider>;
}
