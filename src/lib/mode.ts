/**
 * Interface mode (design.md §1.2.4, §3.1). With no stored choice the page
 * follows prefers-color-scheme; a stored choice sets data-theme on <html>.
 * Choosing the mode the system already prefers clears the stored choice.
 */

export type Mode = "light" | "dark";

export const MODE_STORAGE_KEY = "lw-mode";

const QUERY = "(prefers-color-scheme: dark)";
const CHANGE_EVENT = "lw-mode-change";

/** Runs before first paint (see ModeScript); keep it ES5 and dependency-free. */
export const MODE_BOOT_SCRIPT = `try{var m=localStorage.getItem("${MODE_STORAGE_KEY}");if(m==="light"||m==="dark")document.documentElement.setAttribute("data-theme",m)}catch(e){}`;

function isMode(value: unknown): value is Mode {
  return value === "light" || value === "dark";
}

function systemMode(): Mode {
  return window.matchMedia(QUERY).matches ? "dark" : "light";
}

function applyStored(stored: string | null): void {
  const root = document.documentElement;
  if (isMode(stored)) root.setAttribute("data-theme", stored);
  else root.removeAttribute("data-theme");
}

export function readMode(): Mode {
  const theme = document.documentElement.getAttribute("data-theme");
  return isMode(theme) ? theme : systemMode();
}

export function setMode(mode: Mode): void {
  const stored = mode === systemMode() ? null : mode;
  applyStored(stored);
  try {
    if (stored) localStorage.setItem(MODE_STORAGE_KEY, stored);
    else localStorage.removeItem(MODE_STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); the choice lasts for this page.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeMode(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== MODE_STORAGE_KEY) return;
    applyStored(event.newValue);
    onChange();
  };
  media.addEventListener("change", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}
