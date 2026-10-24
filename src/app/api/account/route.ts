import { auth } from "@clerk/nextjs/server";
import { connection } from "next/server";
import { accountsConfigured } from "@/lib/server/accounts";
export async function GET() {
  await connection();
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
  if (!accountsConfigured()) return Response.json({ available: false, userId: null }, { headers });
  try { return Response.json({ available: true, userId: (await auth()).userId }, { headers }); }
  catch { return Response.json({ error: "Your account could not be checked. Try again." }, { status: 503, headers }); }
}
