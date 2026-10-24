import type { ClerkProvider } from "@clerk/nextjs";
import type { ComponentProps } from "react";

/** Clerk's modal is a page ink scope and follows design.md's square, ruled controls. */
export const clerkAppearance = {
  variables: {
    borderRadius: "0px",
    fontFamily: "var(--lw-font-sans)",
    fontFamilyButtons: "var(--lw-font-sans)",
    fontFamilyMono: "var(--lw-font-mono)",
    fontSize: "15px",
    fontWeight: { normal: 500, medium: 500, semibold: 600, bold: 700 },
    spacing: "16px",
    colorPrimary: "var(--lw-ink)",
    colorPrimaryForeground: "var(--lw-on-ink)",
    colorBackground: "var(--lw-page)",
    colorForeground: "var(--lw-text)",
    colorMuted: "var(--lw-recess)",
    colorMutedForeground: "var(--lw-text-muted)",
    colorInput: "var(--lw-recess)",
    colorInputForeground: "var(--lw-text)",
    colorBorder: "var(--lw-rule-color)",
    colorNeutral: "var(--lw-ink)",
    colorDanger: "var(--lw-signal)",
    colorSuccess: "var(--lw-ink)",
    colorWarning: "var(--lw-ink)",
    colorShadow: "transparent",
    colorRing: "transparent",
    colorModalBackdrop: "var(--lw-band)",
  },
  elements: {
    rootBox: {
      textAlign: "left",
      "& *, & *::before, & *::after": { borderRadius: 0, boxShadow: "none", backgroundImage: "none" },
      "& :focus-visible": { outline: "2px solid var(--lw-ink)", outlineOffset: "2px" },
      "& a": { color: "var(--lw-ink)", textUnderlineOffset: "3px" },
    },
    cardBox: { border: "2px solid var(--lw-ink)", borderRadius: 0, boxShadow: "none" },
    card: { background: "var(--lw-page)", borderRadius: 0, boxShadow: "none", padding: "24px" },
    headerTitle: { color: "var(--lw-text)", fontSize: "28px", lineHeight: "32px", fontWeight: 700, textAlign: "left" },
    headerSubtitle: { color: "var(--lw-text-muted)", fontSize: "15px", lineHeight: "20px", textAlign: "left" },
    formFieldInput: { minHeight: "48px", border: 0, borderBottom: "1px solid var(--lw-rule-color)", borderRadius: 0, boxShadow: "none" },
    formButtonPrimary: { minHeight: "48px", borderRadius: 0, boxShadow: "none", fontSize: "15px", fontWeight: 700, backgroundImage: "none", "&:hover": { background: "var(--lw-ink-hover)" } },
    socialButtonsBlockButton: { minHeight: "48px", border: "2px solid var(--lw-ink)", borderRadius: 0, boxShadow: "none", background: "var(--lw-page)", color: "var(--lw-ink)" },
    footer: { background: "var(--lw-page)", backgroundImage: "none", borderTop: "1px solid var(--lw-rule-color)" },
    modalCloseButton: { color: "var(--lw-ink)", borderRadius: 0, boxShadow: "none", "&:focus-visible": { outline: "2px solid var(--lw-ink)", outlineOffset: "2px" } },
  },
} satisfies ComponentProps<typeof ClerkProvider>["appearance"];
