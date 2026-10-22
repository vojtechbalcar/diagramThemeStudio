/**
 * The small part of culori's tree-shakeable entry ("culori/fn") that
 * src/lib/tokens/colour.ts uses. culori ships no types; this saves adding
 * @types/culori for five functions.
 */
declare module "culori/fn" {
  /** A colour in any registered mode, e.g. { mode: "rgb", r, g, b, alpha }. */
  export type Color = {
    mode: string;
    alpha?: number;
    [channel: string]: number | string | undefined;
  };

  export type Rgb = {
    mode: "rgb";
    r: number;
    g: number;
    b: number;
    alpha?: number;
  };

  /** A mode definition object, passed to useMode to register the mode. */
  export type ModeDefinition = { readonly mode: string };

  export const modeA98: ModeDefinition;
  export const modeHsl: ModeDefinition;
  export const modeHwb: ModeDefinition;
  export const modeLab: ModeDefinition;
  export const modeLch: ModeDefinition;
  export const modeLrgb: ModeDefinition;
  export const modeOklab: ModeDefinition;
  export const modeOklch: ModeDefinition;
  export const modeP3: ModeDefinition;
  export const modeProphoto: ModeDefinition;
  export const modeRec2020: ModeDefinition;
  export const modeRgb: ModeDefinition;
  export const modeXyz50: ModeDefinition;
  export const modeXyz65: ModeDefinition;

  export function useMode(definition: ModeDefinition): (color: Color | string) => Color | undefined;
  export function parse(css: string): Color | undefined;
  export function converter(mode: "rgb"): (color: Color | string) => Rgb | undefined;
  export function toGamut(dest: "rgb", mode?: "oklch"): (color: Color | string) => Rgb;
  export function formatHex(color: Color | string): string | undefined;
}
