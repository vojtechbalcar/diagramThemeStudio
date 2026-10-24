"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AccountSchema, type Account } from "@/lib/saved-sets/model";
import { clerkAppearance } from "./clerk-appearance";

export type AccountState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; account: Account };

type AccountContextValue = { state: AccountState; refresh: () => Promise<void>; clerkEnabled: boolean };
const AccountContext = createContext<AccountContextValue | null>(null);
const loading: AccountState = { status: "loading" };

/** Account availability comes from our backend, even when Clerk is not configured. */
export function AccountProvider({ clerkEnabled, children }: { clerkEnabled: boolean; children: ReactNode }) {
  if (clerkEnabled) {
    return <ClerkProvider appearance={clerkAppearance}><ClerkAccountBoundary>{children}</ClerkAccountBoundary></ClerkProvider>;
  }
  return <AccountBoundary clerkEnabled={false} identity="unconfigured">{children}</AccountBoundary>;
}

/** Clerk hooks are mounted only inside an explicitly configured ClerkProvider. */
function ClerkAccountBoundary({ children }: { children: ReactNode }) {
  const { isLoaded, userId, sessionId } = useAuth();
  const identity = isLoaded ? JSON.stringify([userId ?? null, sessionId ?? null]) : null;
  return <AccountBoundary clerkEnabled identity={identity}>{children}</AccountBoundary>;
}

function AccountBoundary({ clerkEnabled, identity, children }: { clerkEnabled: boolean; identity: string | null; children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<{ identity: string | null; state: AccountState }>({ identity: null, state: loading });
  const active = useRef<{ identity: string | null; sequence: number; controller?: AbortController }>({ identity: null, sequence: 0 });

  const refresh = useCallback(async () => {
    // A callback retained by a previous session must not cancel the new session's read.
    if (identity === null || active.current.identity !== identity) return;
    active.current.controller?.abort();
    const controller = new AbortController();
    const sequence = ++active.current.sequence;
    active.current.controller = controller;
    try {
      const response = await fetch("/api/account", { credentials: "same-origin", cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("Account request failed.");
      const account = AccountSchema.parse(await response.json());
      if (!controller.signal.aborted && active.current.sequence === sequence) {
        setSnapshot({ identity, state: { status: "ready", account } });
      }
    } catch {
      if (!controller.signal.aborted && active.current.sequence === sequence) {
        setSnapshot({ identity, state: { status: "error", message: "Your account could not be checked. Try again." } });
      }
    }
  }, [identity]);

  useEffect(() => {
    const request = active.current;
    request.identity = identity;
    const initialRead = window.setTimeout(() => { void refresh(); }, 0);
    const onFocus = () => { void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => {
      request.identity = null;
      request.sequence++;
      request.controller?.abort();
      window.clearTimeout(initialRead);
      window.removeEventListener("focus", onFocus);
    };
  }, [identity, refresh]);

  // Mask the previous user's data during render, before the session-change effect runs.
  const state = identity !== null && snapshot.identity === identity ? snapshot.state : loading;
  return <AccountContext.Provider value={{ state, refresh, clerkEnabled }}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountContextValue {
  const account = useContext(AccountContext);
  if (!account) throw new Error("useAccount must be used inside AccountProvider.");
  return account;
}
