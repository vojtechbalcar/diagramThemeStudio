import { TokenSetSchema, type TokenSet } from "@/lib/model";

export const MAX_FRAGMENT_LENGTH = 64_000;
const MAX_STATE_BYTES = 1_000_000;
const PREFIX = "#lw=1.";

export type DecodedState = { ok: true; set: TokenSet | null } | { ok: false; error: string };

async function readBounded(stream: ReadableStream<Uint8Array>, limit: number): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel();
        throw new Error("This share link is too large. Share a smaller token set.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

/** Full, validated editor state; the version prefix is part of the public link format. */
export async function encodeState(set: TokenSet): Promise<string> {
  const validated = TokenSetSchema.safeParse(set);
  if (!validated.success) throw new Error("This set cannot be shared. Check its tokens and mappings.");
  if (typeof CompressionStream === "undefined") throw new Error("This browser cannot create compressed share links. Try a current browser.");
  const json = JSON.stringify(validated.data);
  const blob = new Blob([json]);
  if (blob.size > MAX_STATE_BYTES) throw new Error("This set is too large to share. Use fewer tokens.");
  const bytes = await readBounded(blob.stream().pipeThrough(new CompressionStream("deflate")), 48_000);
  const base64 = btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(""))
    .replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
  const fragment = `${PREFIX}${base64}`;
  if (fragment.length > MAX_FRAGMENT_LENGTH) throw new Error("This set is too large to share. Use fewer tokens.");
  return fragment;
}

export async function decodeState(fragment: string): Promise<DecodedState> {
  if (!fragment) return { ok: true, set: null };
  if (fragment.length > MAX_FRAGMENT_LENGTH) return { ok: false, error: "This share link is too large. Ask for a smaller token set." };
  if (/^#lw=\d+\./.test(fragment) && !fragment.startsWith(PREFIX)) {
    return { ok: false, error: "This share link uses an unsupported version. Update Linework or ask for a new link." };
  }
  if (!fragment.startsWith(PREFIX) || !/^[A-Za-z0-9_-]+$/.test(fragment.slice(PREFIX.length))) {
    return { ok: false, error: "This share link is incomplete or invalid. Check that you copied the whole link." };
  }
  if (typeof DecompressionStream === "undefined") return { ok: false, error: "This browser cannot open compressed share links. Try a current browser." };
  try {
    const encoded = fragment.slice(PREFIX.length).replaceAll("-", "+").replaceAll("_", "/");
    const binary = atob(encoded + "=".repeat((4 - encoded.length % 4) % 4));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate"));
    const decoded = await readBounded(stream, MAX_STATE_BYTES);
    const value: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(decoded));
    const result = TokenSetSchema.safeParse(value);
    return result.success
      ? { ok: true, set: result.data }
      : { ok: false, error: "This share link contains invalid tokens or mappings. Ask for a new link." };
  } catch (error) {
    return { ok: false, error: error instanceof Error && error.message.includes("too large")
      ? error.message : "This share link could not be read. Check that you copied the whole link." };
  }
}

export async function shareUrl(set: TokenSet, currentUrl: string): Promise<string> {
  const url = new URL(currentUrl);
  url.pathname = "/editor";
  url.search = "";
  url.hash = await encodeState(set);
  return url.href;
}
