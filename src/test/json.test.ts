import { describe, expect, it } from "vitest";
import { parseJson } from "@/lib/tokens/json";

function problem(text: string) {
  const result = parseJson(text);
  if (result.ok) throw new Error("Expected a parse failure.");
  return result;
}

describe("parseJson", () => {
  it("parses valid JSON, ignoring a byte-order mark", () => {
    expect(parseJson('{"a": [1, 2.5, -3e2, true, null, "x\\u00e9"]}')).toEqual({
      ok: true,
      value: { a: [1, 2.5, -300, true, null, "xé"] },
    });
    expect(parseJson('\uFEFF{"a": 1}')).toEqual({ ok: true, value: { a: 1 } });
  });

  it("says when there is nothing to parse", () => {
    expect(problem("  \n ")).toEqual({ ok: false, message: "The file is empty. Paste a token file." });
  });

  it("points a missing comma at the line that needs it", () => {
    const text = ['{', '  "a": "#FFFFFF"', '  "b": "#000000"', '}'].join("\n");
    expect(problem(text)).toEqual({
      ok: false,
      message: "Line 2 is not valid JSON. Check for a missing comma.",
      line: 2,
    });
    expect(problem('[\n  1\n  2\n]').message).toBe("Line 2 is not valid JSON. Check for a missing comma.");
    expect(problem('{"a": {"b": 1}\n"c": 2}').message).toBe("Line 1 is not valid JSON. Check for a missing comma.");
  });

  it("names the common mistakes", () => {
    const cases: Array<[string, string]> = [
      ['{\n  "a": 1,\n}', "Line 2 is not valid JSON. Remove the comma before the closing bracket."],
      ["[1, 2,]", "Line 1 is not valid JSON. Remove the comma before the closing bracket."],
      ['{\n  "a" 1\n}', "Line 2 is not valid JSON. Check for a missing colon after the name."],
      ["{\n  a: 1\n}", "Line 2 is not valid JSON. Put the name in double quotes."],
      ["{\n  'a': 1\n}", "Line 2 is not valid JSON. Use double quotes, not single quotes."],
      ['{"a": \'x\'}', "Line 1 is not valid JSON. Use double quotes, not single quotes."],
      ['{\n  // brand\n  "a": 1\n}', "Line 2 is not valid JSON. JSON doesn't allow comments. Remove it."],
      ['{"a": "x\n"}', "Line 1 is not valid JSON. Close the text with a double quote."],
      ['{"a": "c:\\d"}', "Line 1 is not valid JSON. Check the backslash. Write \\\\ for a literal backslash."],
      ['{"a": #FFFFFF}', "Line 1 is not valid JSON. Check the value. Text needs double quotes."],
      ['{"a": 16px}', "Line 1 is not valid JSON. Check the value. Text needs double quotes."],
      ['{"a": undefined}', "Line 1 is not valid JSON. Check the value. Text needs double quotes."],
      ['{"a": [1, 2}', "Line 1 is not valid JSON. This bracket doesn't match the one it closes."],
      ['{"a": {"b": 1}\n\n', "Line 3 is not valid JSON. The file ends too early. Check for a missing closing bracket."],
      ['{"a": 1}\n{"b": 2}', "Line 2 is not valid JSON. Remove the text after the last closing bracket."],
    ];
    for (const [text, message] of cases) {
      expect(problem(text).message, text).toBe(message);
    }
  });
});
