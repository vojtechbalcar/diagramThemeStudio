"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { createEditorSet, editorReducer, type EditorAction } from "@/lib/state/editor";
import { decodeState, encodeState } from "@/lib/state/url";

/** Browser URL lifecycle is kept outside the serialisable domain reducer. */
export function useEditorState(notify: (message: string) => void, onRestore: () => void) {
  const [set, reduce] = useReducer(editorReducer, undefined, () => createEditorSet());
  const [ready, setReady] = useState(false);
  const revision = useRef(0);
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
      const ticket = ++revision.current;
      const fragment = window.location.hash;
      dirty.current = false;
      const decoded = await decodeState(fragment);
      if (cancelled) return;
      if (ticket === revision.current && fragment === window.location.hash) {
        if (decoded.ok) {
          onRestore();
          reduce({ type: "replace", set: decoded.set ?? createEditorSet() });
        } else notify(decoded.error);
      }
      setReady(true);
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

  return [set, dispatch] as const;
}
