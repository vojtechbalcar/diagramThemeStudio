import { TOKEN_TYPES, type Token, type TokenType } from "@/lib/model";

const NOUNS: Readonly<Record<TokenType, readonly [one: string, many: string]>> = {
  color: ["colour", "colours"],
  fontFamily: ["font", "fonts"],
  dimension: ["size", "sizes"],
};

/**
 * Counts by type for the import dialog and the title block (design.md
 * §3.2, §3.8): "24 colours, 2 fonts". Types with no tokens are left out.
 */
export function describeTokens(tokens: readonly Pick<Token, "type">[]): string {
  const parts = TOKEN_TYPES.flatMap((type) => {
    const count = tokens.filter((t) => t.type === type).length;
    if (count === 0) return [];
    const [one, many] = NOUNS[type];
    return [`${count} ${count === 1 ? one : many}`];
  });
  return parts.length === 0 ? "No colours, fonts or sizes" : parts.join(", ");
}
