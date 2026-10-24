"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { createEditorSet, editorReducer, type EditorAction } from "@/lib/state/editor";
import { decodeState, encodeState } from "@/lib/state/url";
import { getSavedSet, rememberSavedSet, SavedSetRequestError } from "@/lib/saved-sets/client";
import { SavedSetIdSchema } from "@/lib/saved-sets/model";

/** Browser URL lifecycle is kept outside the serialisable domain reducer. */
export function useEditorState(notify: (message: string) => void, onRestore: () => void) {
  const [set, reduce] = useReducer(editorReducer, undefined, () => createEditorSet());
  const [ready, setReady] = useState(false);
  const revision = useRef(0);
  const navigation = useRef(0);
  const dirty = useRef(false);
  const dispatch = useCallback((action: EditorAction) => {
    // Invalidate pending decodes and encodes immediately, before React commits.
    revision.current++;
    dirty.current = true;
    reduce(action);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      navigation.current++;
      const ticket = ++revision.current;
      const fragment = window.location.hash;
      const search = window.location.search;
      dirty.current = false;
      const current = () => !cancelled && ticket === revision.current && fragment === window.location.hash && search === window.location.search;
      try {
        const decoded = await decodeState(fragment);
        if (!current()) return;
        const id = new URLSearchParams(search).get("set");
        if (decoded.ok && decoded.set) {
          onRestore();
          reduce({ type: "replace", set: decoded.set });
        } else if (id !== null) {
          const parsed = SavedSetIdSchema.safeParse(id);
          if (!parsed.success) throw new Error("This saved-set link is invalid. Open a theme from Saved sets.");
          const saved = await getSavedSet(parsed.data);
          if (current()) {
            rememberSavedSet(saved.id, saved.revision);
            onRestore();
            dirty.current = true;
            reduce({ type: "replace", set: saved.set });
          }
        } else {
          if (current() && decoded.ok) {
            onRestore();
            reduce({ type: "replace", set: createEditorSet() });
          } else if (current() && !decoded.ok) notify(decoded.error);
        }
      } catch (error) {
        if (current()) notify(error instanceof SavedSetRequestError && error.status === 401 ? "Sign in from Saved sets, then reopen this theme." : error instanceof Error ? error.message : "This saved set could not be opened. Try again from Saved sets.");
      } finally { if (!cancelled) setReady(true); }
    }
    void restore();
    window.addEventListener("hashchange", restore);
    window.addEventListener("popstate", restore);
    return () => {
      cancelled = true;
      window.removeEventListener("hashchange", restore);
      window.removeEventListener("popstate", restore);
    };
  }, [notify, onRestore]);

  useEffect(() => {
    if (!ready || !dirty.current) return;
    const ticket = revision.current;
    const originalHash = window.location.hash;
    let cancelled = false;
    const current = () => !cancelled && ticket === revision.current && originalHash === window.location.hash;
    const timer = setTimeout(() => {
      if (!current()) return;
      void encodeState(set).then((fragment) => {
        if (!current()) return;
        window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}${fragment}`);
      }).catch((error: unknown) => {
        if (!current()) return;
        // An old snapshot must not look like a link to an unshareable new set.
        window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);
        notify(error instanceof Error ? error.message : "The current set could not be saved in the URL. Try sharing again.");
      });
    }, 200);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [set, ready, notify]);

  return [set, dispatch, navigation] as const;
}
