import { parseCss } from "./parse-css";
import { parseDtcg } from "./parse-dtcg";
import { parseFigma } from "./parse-figma";
import type { ParseResult } from "./result";
import { failed } from "./result";
import { z } from "zod";
import { TokenSchema } from "@/lib/model";

export const IMPORT_FORMATS = [
  { value: "dtcg", label: "Token file (JSON)" },
  { value: "css", label: "CSS variables" },
  { value: "figma", label: "Figma variables" },
] as const;

export type ImportFormat = (typeof IMPORT_FORMATS)[number]["value"];
const ImportedTokens = z.array(TokenSchema).max(1000);

export function importTokens(format: ImportFormat, text: string): ParseResult {
  const result = format === "css" ? parseCss(text) : format === "figma" ? parseFigma(text) : parseDtcg(text);
  if (!result.ok) return result;
  if (result.tokens.length > 1000) return failed("This file has more than 1,000 tokens. Import a smaller set.");
  const validated = ImportedTokens.safeParse(result.tokens);
  if (!validated.success) return failed("Some token paths or values are invalid or exceed 300 characters. Check the file and try again.");
  return { ...result, tokens: validated.data };
}
