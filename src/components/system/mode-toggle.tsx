"use client";

import { useSyncExternalStore } from "react";
import { readMode, setMode, subscribeMode, type Mode } from "@/lib/mode";
import { IconButton } from "./icon-button";
import { SymbolMoon } from "./symbol-moon";
import { SymbolSun } from "./symbol-sun";

const serverMode = (): Mode | null => null;

/**
 * Shows the current mode: Sun in light, Moon in dark. The symbol is chosen
 * by CSS so it is right before hydration; the pressed state follows once
 * the script runs.
 */
export function ModeToggle() {
  const mode = useSyncExternalStore(subscribeMode, readMode, serverMode);
  return (
    <IconButton
      label="Dark mode"
      aria-pressed={mode === null ? undefined : mode === "dark"}
      onClick={() => setMode(readMode() === "dark" ? "light" : "dark")}
    >
      <SymbolSun className="dark:hidden" />
      <SymbolMoon className="hidden dark:block" />
    </IconButton>
  );
}
