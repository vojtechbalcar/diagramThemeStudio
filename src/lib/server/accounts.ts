import "server-only";
import { auth } from "@clerk/nextjs/server";
import { connection } from "next/server";
import { SavedSetError } from "@/lib/saved-sets/service";

export function clerkConfigured(): boolean { return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY); }
export function accountsConfigured(): boolean { return clerkConfigured() && Boolean(process.env.DATABASE_URL); }

export async function savedSetOwner(): Promise<string | null> {
  await connection();
  if (!accountsConfigured()) throw new SavedSetError(503, "Saved sets are not available here yet. You can keep editing and sharing themes.");
  return (await auth()).userId;
}
