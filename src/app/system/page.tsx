import type { Metadata } from "next";
import { SystemBand } from "@/components/system/system-band";
import { ArrowSection } from "./_specimen/arrow-section";
import { BandSection } from "./_specimen/band-section";
import { BulletSection } from "./_specimen/bullet-section";
import { ColourSection } from "./_specimen/colour-section";
import { Contents } from "./_specimen/contents";
import { ControlSection } from "./_specimen/control-section";
import { RulesSection } from "./_specimen/rules-section";
import { ScopeSection } from "./_specimen/scope-section";
import { SymbolSection } from "./_specimen/symbol-section";
import { TypeSection } from "./_specimen/type-section";
import { UnitSection } from "./_specimen/unit-section";

export const metadata: Metadata = {
  title: "Graphics standards",
  description: "Every element Linework is built from, at the size it is used.",
};

export default function SystemPage() {
  return (
    <>
      <SystemBand subtitle="Graphics standards" />
      <main className="px-6 pb-24">
        <div className="grid grid-cols-12 gap-x-6 gap-y-8 pt-16">
          <div className="col-span-12 lg:col-span-5">
            <h1 className="type-title">Graphics standards</h1>
            <p className="mt-2 max-w-[600px] text-muted">
              Every element Linework is built from. If it is not on this page, it is not in the system; the
              rules behind each one are in design.md.
            </p>
          </div>
          <Contents className="col-span-12 lg:col-span-6 lg:col-start-7" />
        </div>
        <UnitSection />
        <ColourSection />
        <ScopeSection />
        <TypeSection />
        <BandSection />
        <RulesSection />
        <BulletSection />
        <ArrowSection />
        <SymbolSection />
        <ControlSection />
      </main>
    </>
  );
}
