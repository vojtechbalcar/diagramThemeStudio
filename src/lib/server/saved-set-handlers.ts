import "server-only";
import { createSavedSetHandlers } from "@/lib/saved-sets/http";
import { savedSetOwner } from "./accounts";
import { getDatabase } from "./db";
import { postgresSavedSets } from "./saved-sets";

export const savedSetHandlers = createSavedSetHandlers({
  getUserId: savedSetOwner,
  getRepository: () => postgresSavedSets(getDatabase()),
  reportError: (error) => console.error("Saved-set request failed:", error instanceof Error ? error.name : "UnknownError"),
});
