export type SpecimenSectionId =
  | "unit"
  | "colour"
  | "ink"
  | "type"
  | "band"
  | "rules"
  | "bullets"
  | "arrows"
  | "symbols"
  | "controls";

export const SECTIONS: readonly { id: SpecimenSectionId; number: string; title: string }[] = [
  { id: "unit", number: "1.1", title: "Unit and module" },
  { id: "colour", number: "1.2", title: "Colour" },
  { id: "ink", number: "1.2.5", title: "Ink scopes and focus" },
  { id: "type", number: "1.3", title: "Typography" },
  { id: "band", number: "1.4", title: "Band" },
  { id: "rules", number: "1.5", title: "Rules and frames" },
  { id: "bullets", number: "1.6", title: "Bullets" },
  { id: "arrows", number: "1.7", title: "Arrows" },
  { id: "symbols", number: "1.8", title: "Symbols" },
  { id: "controls", number: "3.9", title: "Buttons and controls" },
];

export function sectionMeta(id: SpecimenSectionId) {
  const meta = SECTIONS.find((section) => section.id === id);
  if (!meta) throw new Error(`Unknown specimen section "${id}".`);
  return meta;
}
