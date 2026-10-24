import { expect, it } from "vitest";
import { liveLink } from "@/lib/mermaid/live-link";

it("encodes Unicode source and a JSON configuration string for Mermaid Live", () => {
  const source = "flowchart LR\nA[Žlutá] --> B[東京]";
  const url = new URL(liveLink(source, { primaryColor: "#123456" }));
  const bytes = Uint8Array.from(atob(url.hash.replace("#base64:", "")), (char) => char.charCodeAt(0));
  const state = JSON.parse(new TextDecoder().decode(bytes));
  expect(state.code).toBe(source);
  expect(typeof state.mermaid).toBe("string");
  expect(JSON.parse(state.mermaid)).toMatchObject({ theme: "base", securityLevel: "strict", htmlLabels: false, themeVariables: { primaryColor: "#123456" } });
  expect(state.rough).toBe(false);
});
