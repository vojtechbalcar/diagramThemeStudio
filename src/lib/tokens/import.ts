import { parseCss } from "./parse-css";
import { parseDtcg } from "./parse-dtcg";
import { parseFigma } from "./parse-figma";
import type { ParseResult } from "./result";

export const IMPORT_FORMATS = [
  { value: "dtcg", label: "Token file (JSON)" },
  { value: "css", label: "CSS variables" },
  { value: "figma", label: "Figma variables" },
] as const;

export type ImportFormat = (typeof IMPORT_FORMATS)[number]["value"];

export function importTokens(format: ImportFormat, text: string): ParseResult {
  if (format === "css") return parseCss(text);
  return format === "figma" ? parseFigma(text) : parseDtcg(text);
}
