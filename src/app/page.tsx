import { ButtonLink } from "@/components/system/button-link";
import { SystemBand } from "@/components/system/system-band";

/** Placeholder until the landing page (design.md §3.12) in milestone 5. */
export default function Home() {
  return (
    <>
      <SystemBand />
      <main className="px-6 pt-24 pb-24">
        <h1 className="type-title">Diagrams in your brand&rsquo;s colours.</h1>
        <p className="mt-2 max-w-[560px] text-muted">
          Linework turns design tokens into a Mermaid theme and checks the contrast of every pair. The
          editor is being built; the graphics standards are ready.
        </p>
        <ButtonLink href="/system" arrow className="mt-8">
          View the system
        </ButtonLink>
      </main>
    </>
  );
}
