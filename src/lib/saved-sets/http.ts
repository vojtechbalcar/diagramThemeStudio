import { z } from "zod";
import { MAX_SAVED_SET_BYTES, RevisionSchema, SavedThemeSchema, type SavedSetRepository } from "./model";
import { createSavedSetService, SavedSetError } from "./service";

const CreateSchema = z.strictObject({ set: SavedThemeSchema });
const UpdateSchema = CreateSchema.extend({ revision: RevisionSchema });
const DeleteSchema = z.strictObject({ revision: RevisionSchema });
const HEADERS = { "Cache-Control": "private, no-store", Vary: "Cookie" };

async function body(request: Request): Promise<unknown> {
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) throw new SavedSetError(415, "Send this theme as JSON.");
  if (Number(request.headers.get("Content-Length")) > MAX_SAVED_SET_BYTES) throw new SavedSetError(413, "This theme is too large to save. Use fewer tokens.");
  if (!request.body) throw new SavedSetError(400, "This request is empty. Try again.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_SAVED_SET_BYTES) { await reader.cancel(); throw new SavedSetError(413, "This theme is too large to save. Use fewer tokens."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new SavedSetError(400, "This request is not valid JSON. Try again."); }
}
function sameOrigin(request: Request) {
  if (request.headers.get("Origin") !== new URL(request.url).origin) throw new SavedSetError(403, "This request could not be verified. Reopen the editor and try again.");
}

type Service = ReturnType<typeof createSavedSetService>;
export function createSavedSetHandlers(dependencies: { getUserId: () => Promise<string | null>; getRepository: () => SavedSetRepository; reportError?: (error: unknown) => void }) {
  async function handle(request: Request, operation: (service: Service) => Promise<Response>) {
    try {
      const owner = await dependencies.getUserId();
      if (!owner) throw new SavedSetError(401, "Sign in to access your saved themes.");
      if (request.method !== "GET") sameOrigin(request);
      return await operation(createSavedSetService(dependencies.getRepository(), owner));
    } catch (error) {
      const known = error instanceof SavedSetError;
      const invalid = error instanceof z.ZodError;
      if (!known && !invalid) dependencies.reportError?.(error);
      return Response.json({ error: known ? error.message : invalid ? "This theme or revision is not valid. Check its tokens and try again." : "Saved sets could not be reached. Try again. Your editor has not changed." }, { status: known ? error.status : invalid ? 400 : 503, headers: HEADERS });
    }
  }
  const json = (value: unknown, status = 200) => Response.json(value, { status, headers: HEADERS });
  return {
    collection: {
      GET: (request: Request) => handle(request, async (service) => json(await service.list(new URL(request.url).searchParams.get("cursor") ?? undefined))),
      POST: (request: Request) => handle(request, async (service) => { const input = CreateSchema.parse(await body(request)); return json(await service.create(input.set), 201); }),
    },
    item: {
      GET: (request: Request, id: string) => handle(request, async (service) => json(await service.get(id))),
      PATCH: (request: Request, id: string) => handle(request, async (service) => { const input = UpdateSchema.parse(await body(request)); return json(await service.update(id, input.revision, input.set)); }),
      DELETE: (request: Request, id: string) => handle(request, async (service) => { const input = DeleteSchema.parse(await body(request)); await service.remove(id, input.revision); return new Response(null, { status: 204, headers: HEADERS }); }),
    },
  };
}
