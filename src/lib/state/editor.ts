import { ROLE_TOKEN_TYPE, TokenSchema, TokenSetSchema, type Role, type Surface, type Token, type TokenSet } from "@/lib/model";
import { automap } from "@/lib/theme/automap";
import { defaultSurface } from "@/lib/theme/build-theme";
import { normaliseCssColour } from "@/lib/tokens/colour";
import { dimensionToPx, isFontStack, normaliseDimensionString, normaliseFontFamily } from "@/lib/tokens/values";

export function createEditorSet(tokens: Token[] = []): TokenSet {
  const mapping = automap(tokens);
  return TokenSetSchema.parse({ version: 1, name: "Untitled set", tokens, mapping, surface: defaultSurface(tokens, mapping) });
}

/** Invalid drafts stay in the input; only normalised values reach the shared set. */
export function editToken(token: Token, input: string, path = token.path, alpha?: number): Token | null {
  let next: Token;
  const value = input.trim();
  if (token.type === "color") {
    const colour = normaliseCssColour(value);
    if (!colour) return null;
    const opacity = alpha ?? colour.alpha ?? token.alpha;
    next = { id: token.id, path: path.trim(), type: token.type, source: token.source, value: colour.hex,
      ...(opacity !== undefined && opacity < 1 ? { alpha: opacity } : {}) };
  } else if (token.type === "dimension") {
    const size = normaliseDimensionString(value);
    if (!size || (dimensionToPx(size) ?? 0) <= 0) return null;
    next = { ...token, path: path.trim(), value: size };
  } else {
    const family = normaliseFontFamily(value);
    if (!family || !isFontStack(family, true)) return null;
    next = { ...token, path: path.trim(), value: family };
  }
  const parsed = TokenSchema.safeParse(next);
  return parsed.success ? parsed.data : null;
}

export type EditorAction =
  | { type: "replace"; set: TokenSet }
  | { type: "name"; name: string }
  | { type: "token"; token: Token }
  | { type: "map"; role: Role; tokenId: string }
  | { type: "automap" }
  | { type: "surface"; surface: Surface };

export function editorReducer(state: TokenSet, action: EditorAction): TokenSet {
  switch (action.type) {
    case "replace": {
      const parsed = TokenSetSchema.safeParse(action.set);
      return parsed.success ? parsed.data : state;
    }
    case "name":
      return action.name.length <= 300 ? { ...state, name: action.name } : state;
    case "token": {
      const parsed = TokenSchema.safeParse(action.token);
      if (!parsed.success) return state;
      const token = parsed.data;
      const existing = state.tokens.find((item) => item.id === token.id);
      if (existing && existing.type !== token.type) return state;
      if (!existing && state.tokens.length >= 1000) return state;
      return { ...state, tokens: existing ? state.tokens.map((item) => item.id === token.id ? token : item) : [...state.tokens, token] };
    }
    case "map": {
      const mapping = { ...state.mapping };
      if (!action.tokenId) delete mapping[action.role];
      else {
        const token = state.tokens.find((item) => item.id === action.tokenId);
        if (token?.type !== ROLE_TOKEN_TYPE[action.role]) return state;
        mapping[action.role] = { tokenId: action.tokenId, auto: false };
      }
      return { ...state, mapping };
    }
    case "automap":
      return { ...state, mapping: automap(state.tokens, state.mapping) };
    case "surface":
      return { ...state, surface: action.surface };
  }
}
