/**
 * The four starting presets (design.md §3.2). The palettes are originals,
 * not any company's colours (design.md §8).
 *
 * Mermaid draws text on the background with primaryTextColor too (its
 * textColor is derived from it), so every preset keeps one text colour
 * that reads on both the primary fill and the background.
 */

import { TokenSetSchema, type Role, type TokenSet } from "@/lib/model";
import { withIds, type TokenDraft } from "./result";

type PresetDefinition = {
  id: string;
  name: string;
  colours: Readonly<Record<string, string>>;
  fontFamily: string;
  fontSize: string;
  /** Role → colour path; fontFamily and fontSize map to font.family and font.size. */
  roles: Readonly<Record<Exclude<Role, "fontFamily" | "fontSize">, string>>;
};

const DEFINITIONS: readonly PresetDefinition[] = [
  {
    id: "ink-and-paper",
    name: "Ink & paper",
    colours: {
      "color.ink": "#111111",
      "color.paper": "#FAFAF7",
      "color.white": "#FFFFFF",
      "color.grey.100": "#F3F2EE",
      "color.grey.200": "#ECEAE3",
      "color.grey.300": "#E6E2D6",
    },
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    fontSize: "14px",
    roles: {
      primaryColor: "color.white",
      primaryTextColor: "color.ink",
      primaryBorderColor: "color.ink",
      secondaryColor: "color.grey.200",
      tertiaryColor: "color.grey.100",
      lineColor: "color.ink",
      background: "color.paper",
      noteBkgColor: "color.grey.300",
      noteTextColor: "color.ink",
    },
  },
  {
    id: "signal",
    name: "Signal",
    colours: {
      "color.yellow": "#FFE14D",
      "color.yellow.pale": "#FFF4C2",
      "color.coral.pale": "#FFC9BC",
      "color.vermilion": "#C9361C",
      "color.black": "#141414",
      "color.white": "#FFFFFF",
    },
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", sans-serif',
    fontSize: "15px",
    roles: {
      primaryColor: "color.yellow",
      primaryTextColor: "color.black",
      primaryBorderColor: "color.black",
      secondaryColor: "color.coral.pale",
      tertiaryColor: "color.yellow.pale",
      lineColor: "color.vermilion",
      background: "color.white",
      noteBkgColor: "color.black",
      noteTextColor: "color.yellow",
    },
  },
  {
    id: "forest",
    name: "Forest",
    colours: {
      "color.moss": "#3E6B4E",
      "color.sage": "#CFE3C8",
      "color.sage.pale": "#E4ECDC",
      "color.wheat": "#E6DCBC",
      "color.amber.pale": "#F0D9A8",
      "color.cream": "#F4F1E8",
      "color.bark": "#1E2B22",
    },
    fontFamily: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
    fontSize: "15px",
    roles: {
      primaryColor: "color.sage",
      primaryTextColor: "color.bark",
      primaryBorderColor: "color.moss",
      secondaryColor: "color.wheat",
      tertiaryColor: "color.sage.pale",
      lineColor: "color.moss",
      background: "color.cream",
      noteBkgColor: "color.amber.pale",
      noteTextColor: "color.bark",
    },
  },
  {
    id: "night",
    name: "Night",
    colours: {
      "color.night": "#0F1420",
      "color.navy": "#1F2A40",
      "color.navy.deep": "#172033",
      "color.slate": "#2C3A57",
      "color.steel": "#7C8DB0",
      "color.haze": "#8FA1C7",
      "color.frost": "#E6EBF5",
      "color.umber": "#3A3320",
      "color.straw": "#F3E3B3",
    },
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    fontSize: "14px",
    roles: {
      primaryColor: "color.navy",
      primaryTextColor: "color.frost",
      primaryBorderColor: "color.steel",
      secondaryColor: "color.slate",
      tertiaryColor: "color.navy.deep",
      lineColor: "color.haze",
      background: "color.night",
      noteBkgColor: "color.umber",
      noteTextColor: "color.straw",
    },
  },
];

export type Preset = { id: string; set: TokenSet };

function toSet(definition: PresetDefinition): TokenSet {
  const drafts: TokenDraft[] = [
    ...Object.entries(definition.colours).map(
      ([path, value]): TokenDraft => ({ path, type: "color", value, source: "preset" }),
    ),
    { path: "font.family", type: "fontFamily", value: definition.fontFamily, source: "preset" },
    { path: "font.size", type: "dimension", value: definition.fontSize, source: "preset" },
  ];
  const tokens = withIds(drafts);
  const idOf = (path: string) => {
    const token = tokens.find((t) => t.path === path);
    if (!token) throw new Error(`Preset "${definition.name}" maps a role to missing token "${path}".`);
    return token.id;
  };
  const roles: Record<Role, string> = { ...definition.roles, fontFamily: "font.family", fontSize: "font.size" };
  const mapping = Object.fromEntries(
    Object.entries(roles).map(([role, path]) => [role, { tokenId: idOf(path), auto: false }]),
  );
  // Validate once, so a mistake in the definitions fails loudly in tests.
  return TokenSetSchema.parse({ version: 1, name: definition.name, tokens, mapping, surface: "brand" });
}

export const PRESETS: readonly Preset[] = DEFINITIONS.map((definition) => ({
  id: definition.id,
  set: toSet(definition),
}));

export function presetById(id: string): Preset | undefined {
  return PRESETS.find((preset) => preset.id === id);
}
