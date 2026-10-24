"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "@/components/system/button";
import { useAccount } from "./account-provider";

export function SignOutControl({ label = "Sign out" }: { label?: string }) {
  const { clerkEnabled } = useAccount();
  if (!clerkEnabled) return null;
  return <ConfiguredSignOut label={label} />;
}

function ConfiguredSignOut({ label }: { label: string }) {
  const { signOut } = useClerk();
  const { isLoaded } = useAuth();
  const { refresh } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div className="flex flex-wrap items-center gap-2">
    <Button variant="text" disabled={!isLoaded || busy} onClick={async () => {
      setBusy(true);
      setError("");
      try { await signOut(); await refresh(); }
      catch { setError("Could not sign out. Try again."); }
      finally { setBusy(false); }
    }}>{busy ? "Signing out…" : label}</Button>
    {error ? <p role="status" className="type-small text-signal">{error}</p> : null}
  </div>;
}
