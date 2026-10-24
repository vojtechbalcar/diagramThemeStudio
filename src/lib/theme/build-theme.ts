/**
 * (tokens, mapping) → Mermaid themeVariables.
 *
 * Follows the Mermaid rules in CLAUDE.md: always theme "base", colours as
 * #RRGGBB only, and unmapped roles left out so Mermaid derives them.
 */

import { ROLES, ROLE_TOKEN_TYPE, type Mapping, type Role, type Surface, type Token } from "@/lib/model";
import { higherContrast } from "@/lib/contrast/wcag";
import { composite } from "@/lib/tokens/colour";
import { diagramTheme, type DiagramThemeVariables } from "./diagram-theme";
import { dimensionToPx } from "@/lib/tokens/values";

/** The fixed preview surfaces (design.md §1.2.3). */
export const PAPER = "#FFFFFF";
export const INK = "#0B0B0B";

export type ThemeVariables = Partial<Record<Role, string>> & DiagramThemeVariables & {
  /**
   * Set when the mapped background is dark, so the colours Mermaid derives
   * (borders, label fills, default text) suit a dark background.
   */
  darkMode?: true;
};

export type MermaidConfig = {
  startOnLoad: false;
  theme: "base";
  securityLevel: "strict";
  /** Pinned so a Mermaid default change can't add gradients or shadows. */
  look: "classic";
  themeVariables: ThemeVariables;
};

/** The token mapped to `role`, if it exists and is the right type. */
export function mappedToken(role: Role, tokens: readonly Token[], mapping: Mapping): Token | undefined {
  const entry = mapping[role];
  if (!entry) return undefined;
  const token = tokens.find((t) => t.id === entry.tokenId);
  return token?.type === ROLE_TOKEN_TYPE[role] ? token : undefined;
}

/** A colour token as opaque hex; a translucent one is composited over `backdrop`. */
function opaqueHex(token: Token, backdrop: string): string {
  return token.alpha === undefined ? token.value : composite(token.value, token.alpha, backdrop);
}

/** The background role's colour, made opaque over Paper. */
export function backgroundHex(tokens: readonly Token[], mapping: Mapping): string | undefined {
  const token = mappedToken("background", tokens, mapping);
  return token ? opaqueHex(token, PAPER) : undefined;
}

/** The colour behind the diagrams for a preview surface. Brand without a background token is Paper. */
export function surfaceHex(surface: Surface, tokens: readonly Token[], mapping: Mapping): string {
  if (surface === "ink") return INK;
  if (surface === "brand") return backgroundHex(tokens, mapping) ?? PAPER;
  return PAPER;
}

/** Brand when a background token is mapped, otherwise Paper (design.md §1.2.3). */
export function defaultSurface(tokens: readonly Token[], mapping: Mapping): Surface {
  return mappedToken("background", tokens, mapping) ? "brand" : "paper";
}

export type BuildOptions = {
  /**
   * What translucent tokens are composited over, since Mermaid takes no
   * alpha. Defaults to the mapped background, else Paper. The preview
   * passes the current surface so what you see is what is checked.
   */
  backdrop?: string;
};

export function buildThemeVariables(
  tokens: readonly Token[],
  mapping: Mapping,
  options: BuildOptions = {},
): ThemeVariables {
  const background = backgroundHex(tokens, mapping);
  const backdrop = options.backdrop ?? background ?? PAPER;
  const variables: ThemeVariables = {};

  for (const role of ROLES) {
    const token = mappedToken(role, tokens, mapping);
    if (!token) continue;
    if (token.type === "color") {
      variables[role] = role === "background" && background ? background : opaqueHex(token, backdrop);
    } else if (token.type === "dimension") {
      // Mermaid measures text from a px size; "1rem" would be read as 1.
      const px = dimensionToPx(token.value);
      if (px !== null) variables[role] = `${px}px`;
    } else {
      variables[role] = token.value;
    }
  }

  if (background && higherContrast(background, "#000000", "#FFFFFF") === "#FFFFFF") {
    variables.darkMode = true;
  }
  return { ...variables, ...diagramTheme(variables) };
}

export function mermaidConfig(themeVariables: ThemeVariables): MermaidConfig {
  return { startOnLoad: false, theme: "base", securityLevel: "strict", look: "classic", themeVariables };
}
