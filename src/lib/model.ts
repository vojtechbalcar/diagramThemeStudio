/**
 * The domain model (CLAUDE.md "Domain model") as zod schemas, with the
 * TypeScript types inferred from them. A TokenSet is what the share link
 * encodes and, in v2, what Postgres stores; keep it plain serialisable data.
 */

import { z } from "zod";

export const TOKEN_TYPES = ["color", "fontFamily", "dimension"] as const;
export const TOKEN_SOURCES = ["dtcg", "css", "figma", "manual", "preset"] as const;
export const SURFACES = ["paper", "ink", "brand"] as const;

/** In mapping-panel order (design.md §3.3). */
export const ROLES = [
  "primaryColor",
  "primaryTextColor",
  "primaryBorderColor",
  "secondaryColor",
  "tertiaryColor",
  "lineColor",
  "background",
  "noteBkgColor",
  "noteTextColor",
  "fontFamily",
  "fontSize",
] as const;

export type TokenType = (typeof TOKEN_TYPES)[number];
export type TokenSource = (typeof TOKEN_SOURCES)[number];
export type Surface = (typeof SURFACES)[number];
export type Role = (typeof ROLES)[number];

/** Which kind of token each role takes. */
export const ROLE_TOKEN_TYPE: Readonly<Record<Role, TokenType>> = {
  primaryColor: "color",
  primaryTextColor: "color",
  primaryBorderColor: "color",
  secondaryColor: "color",
  tertiaryColor: "color",
  lineColor: "color",
  background: "color",
  noteBkgColor: "color",
  noteTextColor: "color",
  fontFamily: "fontFamily",
  fontSize: "dimension",
};

export const HEX_COLOUR = /^#[0-9A-F]{6}$/;
export const DIMENSION = /^\d+(?:\.\d+)?(?:px|rem)$/;

// Generous limits that keep a share link and a database row bounded.
const MAX_TOKENS = 1000;
const MAX_TEXT = 300;

export const TokenSchema = z
  .object({
    id: z.string().min(1).max(64),
    path: z.string().min(1).max(MAX_TEXT),
    type: z.enum(TOKEN_TYPES),
    value: z.string().min(1).max(MAX_TEXT),
    alpha: z.number().min(0).max(1).optional(),
    source: z.enum(TOKEN_SOURCES),
  })
  .superRefine((token, ctx) => {
    if (token.type === "color" && !HEX_COLOUR.test(token.value)) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Colours must be uppercase #RRGGBB." });
    }
    if (token.type !== "color" && token.alpha !== undefined) {
      ctx.addIssue({ code: "custom", path: ["alpha"], message: "Only colours have alpha." });
    }
    if (token.type === "dimension" && !DIMENSION.test(token.value)) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Dimensions are px or rem, e.g. 16px." });
    }
  });

export const MappingEntrySchema = z.object({
  tokenId: z.string().min(1).max(64),
  /** True for an auto-map guess the user hasn't confirmed yet. */
  auto: z.boolean(),
});

export const MappingSchema = z.partialRecord(z.enum(ROLES), MappingEntrySchema);

export const TokenSetSchema = z
  .object({
    version: z.literal(1),
    name: z.string().max(80),
    tokens: z.array(TokenSchema).max(MAX_TOKENS),
    mapping: MappingSchema,
    surface: z.enum(SURFACES),
  })
  .superRefine((set, ctx) => {
    const byId = new Map<string, Token>();
    set.tokens.forEach((token, index) => {
      if (byId.has(token.id)) {
        ctx.addIssue({ code: "custom", path: ["tokens", index, "id"], message: `Duplicate token id "${token.id}".` });
      }
      byId.set(token.id, token);
    });
    for (const role of ROLES) {
      const entry = set.mapping[role];
      if (!entry) continue;
      const token = byId.get(entry.tokenId);
      if (!token) {
        ctx.addIssue({ code: "custom", path: ["mapping", role], message: `Maps to a missing token "${entry.tokenId}".` });
      } else if (token.type !== ROLE_TOKEN_TYPE[role]) {
        ctx.addIssue({ code: "custom", path: ["mapping", role], message: `Needs a ${ROLE_TOKEN_TYPE[role]} token.` });
      }
    }
  });

export type Token = z.infer<typeof TokenSchema>;
export type MappingEntry = z.infer<typeof MappingEntrySchema>;
export type Mapping = z.infer<typeof MappingSchema>;
export type TokenSet = z.infer<typeof TokenSetSchema>;
