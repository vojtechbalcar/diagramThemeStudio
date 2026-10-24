import type { ReactNode } from "react";
import { Band } from "@/components/system/band";
import { sectionMeta, type SpecimenSectionId } from "./sections";

export type SpecimenSectionProps = {
  id: SpecimenSectionId;
  intro?: ReactNode;
  children: ReactNode;
};

/** One specimen sheet: a band with the manual's section number, then a 12-column body. */
export function SpecimenSection({ id, intro, children }: SpecimenSectionProps) {
  const { number, title } = sectionMeta(id);
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-16 scroll-mt-6">
      <Band id={`${id}-title`} title={title}>
        <span className="type-mono text-muted">§{number}</span>
      </Band>
      {intro ? <p className="mt-6 max-w-[720px] text-muted">{intro}</p> : null}
      <div className="mt-8 grid grid-cols-12 gap-x-6 gap-y-12">{children}</div>
    </section>
  );
}
