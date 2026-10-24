import type { Metadata } from "next";
import { SavedSetLibrary } from "@/components/accounts/saved-set-library";

export const metadata: Metadata = { title: "Saved sets" };
export default function SavedSetsPage() { return <SavedSetLibrary />; }
