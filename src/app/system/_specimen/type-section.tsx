import { Figure } from "./figure";
import { SpecimenSection } from "./specimen-section";

const STYLES = [
  { name: "display", spec: "64/64 · 700 · −0.03em", className: "type-display", sample: "1 2 3 4" },
  { name: "title", spec: "28/32 · 700 · −0.02em", className: "type-title", sample: "Diagrams in your brand’s colours." },
  { name: "band", spec: "20/24 · 700 · −0.01em", className: "type-band", sample: "Tokens" },
  { name: "heading", spec: "15/20 · 700 · 0", className: "type-heading", sample: "Colours" },
  { name: "body", spec: "15/20 · 500 · 0", className: "type-body", sample: "No tokens yet. Paste a token file or start from a preset." },
  { name: "small", spec: "13/16 · 500 · 0", className: "type-small", sample: "24 colours, 2 fonts found" },
  { name: "micro", spec: "11/16 · 600 · +0.02em", className: "type-micro", sample: "Fig. 1 — Flowchart" },
  { name: "mono", spec: "13/16 · 500 · 0", className: "type-mono", sample: "color.brand.primary  #2F5BD3  4.8:1" },
  { name: "mono-small", spec: "11/16 · 500 · 0", className: "type-mono-small", sample: "#2F5BD3  80%" },
] as const;

export function TypeSection() {
  return (
    <SpecimenSection
      id="type"
      intro="Inter for everything a person reads, JetBrains Mono for every machine value. Mixed case, flush left, no italics."
    >
      <Figure caption="Fig. 1.3a — Inter, variable, 500 by default" className="md:col-span-6">
        <div className="border-t border-rule pt-6">
          <p aria-hidden className="type-display">
            Aa
          </p>
          <p className="mt-6">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
          <p>abcdefghijklmnopqrstuvwxyz</p>
          <p className="tabular-nums">0123456789 4.8:1</p>
        </div>
      </Figure>
      <Figure caption="Fig. 1.3b — JetBrains Mono, values only" className="md:col-span-6">
        <div className="border-t border-rule pt-6">
          <p aria-hidden className="type-display font-mono">
            Aa
          </p>
          <p className="mt-6 type-mono">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
          <p className="type-mono">abcdefghijklmnopqrstuvwxyz</p>
          <p className="type-mono">0123456789 #2F5BD3 {"{ }"}</p>
        </div>
      </Figure>

      <Figure caption="Fig. 1.3c — Type scale. These nine styles are the only ones." className="col-span-12">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="h-8 border-b border-rule type-small text-muted">
                <th scope="col" className="w-[128px] pr-6 font-medium">
                  Style
                </th>
                <th scope="col" className="w-[192px] pr-6 font-medium">
                  Size · weight · tracking
                </th>
                <th scope="col" className="font-medium">
                  Sample
                </th>
              </tr>
            </thead>
            <tbody>
              {STYLES.map((style) => (
                <tr key={style.name} className="border-b border-rule">
                  <th scope="row" className="py-4 pr-6 align-baseline type-mono">
                    {style.name}
                  </th>
                  <td className="py-4 pr-6 align-baseline type-mono-small text-muted">{style.spec}</td>
                  <td className={`py-4 align-baseline ${style.className}`}>{style.sample}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Figure>
    </SpecimenSection>
  );
}
