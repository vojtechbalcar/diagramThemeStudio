"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount } from "./account-provider";
import { SignInControl } from "./sign-in-control";
import { SignOutControl } from "./sign-out-control";
import { Band } from "@/components/system/band";
import { SystemBand } from "@/components/system/system-band";
import { Button } from "@/components/system/button";
import { ButtonLink } from "@/components/system/button-link";
import { Bullet } from "@/components/system/bullet";
import { EditorDialog } from "@/components/editor/editor-dialog";
import { deleteSavedSet, listSavedSets, SavedSetRequestError } from "@/lib/saved-sets/client";
import type { SavedSetSummary, SavedSetsPage } from "@/lib/saved-sets/model";

export function SavedSetLibrary() {
  const { state, refresh } = useAccount();
  return <>
    <SystemBand><ButtonLink href="/editor" variant="text">Editor</ButtonLink></SystemBand>
    <main className="mx-auto w-full max-w-5xl border-x border-rule">
      <Band title="Saved sets" />
      <div className="border-b border-rule p-4 md:p-6"><h1 id="saved-sets-heading" tabIndex={-1} className="break-words type-title md:type-display">Your themes, kept together.</h1><p className="mt-3 max-w-xl type-body text-muted">Save a theme to reopen it on another device. Your saved sets are private to your account.</p></div>
      {state.status === "loading" ? <p role="status" className="p-6 type-body text-muted">Checking your account…</p>
        : state.status === "error" ? <div className="p-6"><p role="alert" className="type-body">{state.message}</p><Button className="mt-4" variant="secondary" onClick={() => { void refresh(); }}>Try again</Button></div>
        : !state.account.available ? <div className="p-6"><h2 className="type-heading">Accounts are not available here yet.</h2><p className="mt-2 type-body text-muted">You can keep editing and sharing themes.</p><ButtonLink href="/editor" className="mt-4">Open the editor</ButtonLink></div>
        : !state.account.userId ? <div className="p-6"><h2 className="type-heading">Sign in to save your themes.</h2><p className="mb-4 mt-2 type-body text-muted">Your editor draft stays in this browser while you sign in.</p><SignInControl /></div>
        : <PrivateLibrary key={state.account.userId} />}
    </main>
  </>;
}

function PrivateLibrary() {
  const [page, setPage] = useState<SavedSetsPage | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");
  const [retryCursor, setRetryCursor] = useState<string>();
  const [removing, setRemoving] = useState<SavedSetSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const active = useRef(true);
  const read = useRef<{ sequence: number; controller?: AbortController }>({ sequence: 0 });
  const deleteTrigger = useRef<HTMLButtonElement | null>(null);
  const deleted = useRef(false);

  async function load(cursor?: string) {
    read.current.controller?.abort();
    const controller = new AbortController();
    const sequence = ++read.current.sequence;
    read.current.controller = controller;
    setPending(true); setError(""); setRetryCursor(cursor);
    try {
      const next = await listSavedSets(cursor, controller.signal);
      if (!active.current || sequence !== read.current.sequence) return;
      setPage((current) => cursor && current ? { items: [...current.items, ...next.items.filter((item) => !current.items.some((existing) => existing.id === item.id))], nextCursor: next.nextCursor } : next);
    } catch (error) {
      if (active.current && !controller.signal.aborted && sequence === read.current.sequence) setError(error instanceof Error ? error.message : "Could not load your saved sets.");
    } finally { if (active.current && sequence === read.current.sequence) setPending(false); }
  }
  useEffect(() => {
    active.current = true;
    const request = read.current;
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => { active.current = false; window.clearTimeout(timer); request.controller?.abort(); request.sequence++; };
  }, []);

  return <>
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule px-4 py-2"><ButtonLink href="/editor" variant="secondary">New theme</ButtonLink><SignOutControl /></div>
    {error ? <div className="border-b border-rule p-4"><p role="alert" className="type-body">{error}</p><Button variant="secondary" className="mt-3" onClick={() => { void load(retryCursor); }}>Try again</Button></div> : null}
    {!page && pending ? <p role="status" className="p-6 type-body text-muted">Loading your saved sets…</p> : null}
    {page?.items.length === 0 ? <div className="p-6"><h2 className="type-heading">No saved sets yet.</h2><p className="mt-2 type-body text-muted">Start from a preset or import tokens, then choose Save in the editor.</p><ButtonLink href="/editor" className="mt-4">Create a theme</ButtonLink></div> : null}
    {page?.items.map((item) => <article key={item.id} className="flex flex-wrap items-center gap-4 border-b border-rule p-4 md:p-6">
      <div className="flex gap-1" aria-label="Theme colours">{item.colors.map((color, index) => <Bullet key={index} kind="token" glyph={null} color={color} label={color} />)}</div>
      <div className="min-w-0 flex-1 basis-[160px]"><h2 className="break-words type-heading">{item.name}</h2><p className="mt-1 type-micro text-muted">{item.tokenCount} tokens · <time dateTime={item.updatedAt}>{new Date(item.updatedAt).toLocaleDateString()}</time></p></div>
      <div className="flex flex-wrap gap-2"><ButtonLink href={`/editor?set=${item.id}`} prefetch={false} variant="secondary" aria-label={`Open ${item.name}`}>Open</ButtonLink><Button variant="text" aria-label={`Delete ${item.name}`} disabled={pending} onClick={(event) => { deleteTrigger.current = event.currentTarget; deleted.current = false; setRemoving(item); setDeleteError(""); }}>Delete</Button></div>
    </article>)}
    {page?.nextCursor ? <div className="p-4"><Button variant="secondary" disabled={pending} onClick={() => { void load(page.nextCursor ?? undefined); }}>{pending ? "Loading…" : "Load more"}</Button></div> : null}
    <EditorDialog title="Delete saved set" description="Confirm deletion of a saved theme. This cannot be undone." open={!!removing} onOpenChange={(open) => { if (!open && !deleting) setRemoving(null); }} onCloseAutoFocus={(event) => {
      event.preventDefault();
      (!deleted.current && deleteTrigger.current?.isConnected ? deleteTrigger.current : document.querySelector<HTMLElement>("#saved-sets-heading"))?.focus();
    }}>
      <div className="p-6"><p className="type-body">Delete <strong className="break-words">{removing?.name}</strong>? This cannot be undone. Any draft already open in the editor stays there.</p>
        {deleteError ? <p role="alert" className="mt-4 type-body text-signal">{deleteError}</p> : null}
        <div className="mt-6 flex flex-wrap justify-end gap-2"><Button variant="secondary" disabled={deleting} onClick={() => setRemoving(null)}>Cancel</Button><Button disabled={deleting || !removing} onClick={async () => {
          if (!removing || deleting) return;
          setDeleting(true); setDeleteError("");
          try {
            await deleteSavedSet(removing.id, removing.revision);
            if (!active.current) return;
            deleted.current = true; setRemoving(null); await load();
          } catch (error) {
            if (!active.current) return;
            setDeleteError(error instanceof Error ? error.message : "Could not delete this set. Try again.");
            if (error instanceof SavedSetRequestError && [404, 409].includes(error.status)) { deleted.current = true; setRemoving(null); await load(); setError(error.message); }
          } finally { if (active.current) setDeleting(false); }
        }}>{deleting ? "Deleting…" : "Delete set"}</Button></div>
      </div>
    </EditorDialog>
  </>;
}
