import { MODE_BOOT_SCRIPT } from "@/lib/mode";

/**
 * Applies a stored mode before first paint, so dark-mode users never see a
 * light flash. It is text/plain on the client, so React does not warn about
 * rendering a script (Next.js guide: preventing flash before hydration).
 */
export function ModeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: MODE_BOOT_SCRIPT }}
    />
  );
}
