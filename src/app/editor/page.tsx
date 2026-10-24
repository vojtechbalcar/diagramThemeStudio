import type { Metadata } from "next";
import { Editor } from "@/components/editor/editor";

export const metadata: Metadata = { title: "Editor" };

export default function EditorPage() {
  return <Editor />;
}
