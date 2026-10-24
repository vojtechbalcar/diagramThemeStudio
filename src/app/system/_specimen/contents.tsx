import { cn } from "@/lib/cn";
import { SECTIONS } from "./sections";

/** Ruled contents list; full-width rows take the inset focus ring. */
export function Contents({ className }: { className?: string }) {
  return (
    <nav aria-labelledby="contents-title" className={className}>
      <h2 id="contents-title" className="type-heading">
        Contents
      </h2>
      <ol className="mt-3 grid border-t border-rule md:grid-cols-2 md:gap-x-6">
        {SECTIONS.map((section) => (
          <li key={section.id} className="border-b border-rule">
            <a
              href={`#${section.id}`}
              className={cn(
                "flex h-8 items-center gap-4 px-2 type-small",
                "hover:bg-recess focus-visible:-outline-offset-4",
              )}
            >
              <span className="w-12 shrink-0 type-mono-small text-muted tabular-nums">{section.number}</span>
              <span>{section.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
