import { savedSetHandlers } from "@/lib/server/saved-set-handlers";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) { return savedSetHandlers.item.GET(request, (await context.params).id); }
export async function PATCH(request: Request, context: Context) { return savedSetHandlers.item.PATCH(request, (await context.params).id); }
export async function DELETE(request: Request, context: Context) { return savedSetHandlers.item.DELETE(request, (await context.params).id); }
