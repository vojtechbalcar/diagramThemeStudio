/**
 * JSON.parse with messages a person can act on (design.md §2.3):
 * "Line 14 is not valid JSON. Check for a missing comma."
 *
 * Browsers word and locate JSON errors differently (Safari gives no
 * position at all), so on failure a small strict scanner walks the text
 * again to find the first problem and name the likely fix.
 */

export type JsonResult = { ok: true; value: unknown } | { ok: false; message: string; line?: number };

class JsonProblem {
  constructor(
    readonly index: number,
    readonly hint: string,
  ) {}
}

const HINT = {
  comma: "Check for a missing comma.",
  trailingComma: "Remove the comma before the closing bracket.",
  colon: "Check for a missing colon after the name.",
  quoteName: "Put the name in double quotes.",
  singleQuotes: "Use double quotes, not single quotes.",
  comment: "JSON doesn't allow comments. Remove it.",
  unclosedString: "Close the text with a double quote.",
  escape: "Check the backslash. Write \\\\ for a literal backslash.",
  value: "Check the value. Text needs double quotes.",
  early: "The file ends too early. Check for a missing closing bracket.",
  bracket: "This bracket doesn't match the one it closes.",
  extra: "Remove the text after the last closing bracket.",
} as const;

const NUMBER = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
const LITERAL = /true|false|null/y;

class Scanner {
  private i = 0;
  /** Where the last complete value ended, for "missing comma" reports. */
  private lastEnd = 0;

  constructor(private readonly text: string) {}

  check(): void {
    this.space();
    this.value();
    this.space();
    if (this.i < this.text.length) throw new JsonProblem(this.i, HINT.extra);
  }

  private space(): void {
    for (;;) {
      const ch = this.text[this.i];
      if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
        this.i++;
      } else if (ch === "/" && (this.text[this.i + 1] === "/" || this.text[this.i + 1] === "*")) {
        throw new JsonProblem(this.i, HINT.comment);
      } else {
        return;
      }
    }
  }

  private value(): void {
    const ch = this.text[this.i];
    if (ch === undefined) throw new JsonProblem(this.i, HINT.early);
    if (ch === "{") this.object();
    else if (ch === "[") this.array();
    else if (ch === '"') this.string();
    else if (ch === "'") throw new JsonProblem(this.i, HINT.singleQuotes);
    else if (ch === "-" || (ch >= "0" && ch <= "9")) this.match(NUMBER);
    else this.match(LITERAL);
    this.lastEnd = this.i - 1;
  }

  private match(pattern: RegExp): void {
    pattern.lastIndex = this.i;
    const found = pattern.exec(this.text);
    const next = found ? this.text[this.i + found[0].length] : undefined;
    // `truex` or `12px` is one bad value, not a value followed by junk.
    if (!found || (next !== undefined && /[\w.#%]/.test(next))) {
      throw new JsonProblem(this.i, HINT.value);
    }
    this.i += found[0].length;
  }

  private string(): void {
    const start = this.i;
    this.i++;
    for (;;) {
      const ch = this.text[this.i];
      if (ch === undefined || ch === "\n" || ch === "\r") throw new JsonProblem(start, HINT.unclosedString);
      if (ch === '"') {
        this.i++;
        return;
      }
      if (ch === "\\") {
        const escape = this.text[this.i + 1];
        if (escape === "u") {
          if (!/^[0-9a-fA-F]{4}$/.test(this.text.slice(this.i + 2, this.i + 6))) {
            throw new JsonProblem(this.i, HINT.escape);
          }
          this.i += 6;
          continue;
        }
        if (escape === undefined || !'"\\/bfnrt'.includes(escape)) throw new JsonProblem(this.i, HINT.escape);
        this.i += 2;
        continue;
      }
      this.i++;
    }
  }

  /** After a member or element: a comma, the closing bracket, or a problem. */
  private separator(close: "}" | "]"): "more" | "done" {
    this.space();
    const ch = this.text[this.i];
    if (ch === close) {
      this.i++;
      return "done";
    }
    if (ch === ",") {
      const comma = this.i;
      this.i++;
      this.space();
      if (this.text[this.i] === close) throw new JsonProblem(comma, HINT.trailingComma);
      return "more";
    }
    if (ch === undefined) throw new JsonProblem(this.i, HINT.early);
    if (ch === "}" || ch === "]") throw new JsonProblem(this.i, HINT.bracket);
    // The comma belongs at the end of the previous value, so point there.
    throw new JsonProblem(this.lastEnd, HINT.comma);
  }

  private object(): void {
    this.i++;
    this.space();
    if (this.text[this.i] === "}") {
      this.i++;
      return;
    }
    for (;;) {
      const ch = this.text[this.i];
      if (ch === undefined) throw new JsonProblem(this.i, HINT.early);
      if (ch === "'") throw new JsonProblem(this.i, HINT.singleQuotes);
      if (ch !== '"') throw new JsonProblem(this.i, /[\w$]/.test(ch) ? HINT.quoteName : HINT.value);
      this.string();
      this.space();
      if (this.text[this.i] !== ":") {
        throw new JsonProblem(this.i, this.text[this.i] === undefined ? HINT.early : HINT.colon);
      }
      this.i++;
      this.space();
      this.value();
      if (this.separator("}") === "done") return;
    }
  }

  private array(): void {
    this.i++;
    this.space();
    if (this.text[this.i] === "]") {
      this.i++;
      return;
    }
    for (;;) {
      this.value();
      if (this.separator("]") === "done") return;
    }
  }
}

function lineAt(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text[i] === "\n") line++;
  return line;
}

export function parseJson(input: string): JsonResult {
  const text = input.replace(/^﻿/, "");
  if (text.trim() === "") return { ok: false, message: "The file is empty. Paste a token file." };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    try {
      new Scanner(text).check();
    } catch (problem) {
      if (problem instanceof JsonProblem) {
        const line = lineAt(text, problem.index);
        return { ok: false, message: `Line ${line} is not valid JSON. ${problem.hint}`, line };
      }
      throw problem;
    }
    // The scanner found nothing; fall back to a general message.
    return { ok: false, message: "This is not valid JSON. Check the file and paste it again." };
  }
}
