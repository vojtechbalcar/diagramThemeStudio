import { Band } from "@/components/system/band";
import { Bullet } from "@/components/system/bullet";
import { SAMPLE_TOKENS } from "@/lib/system/specimen";
import { Figure } from "./figure";
import { SpecimenSection } from "./specimen-section";

export function RulesSection() {
  return (
    <SpecimenSection
      id="rules"
      intro="Structure is drawn with rules, never with shadows or gaps. Corner radius is zero everywhere; bullets are the only circles."
    >
      <Figure caption="Fig. 1.5a — Rows separated by 1px rules, no zebra striping" className="md:col-span-6">
        <ul className="border-t border-rule">
          {SAMPLE_TOKENS.slice(0, 4).map((token) => (
            <li key={token.glyph} className="flex h-12 items-center gap-3 border-b border-rule px-4">
              <Bullet kind="token" glyph={token.glyph} color={token.hex} label={`${token.role}, ${token.hex}`} />
              <span className="flex-1">{token.role.toLowerCase()}</span>
              <span className="type-mono">{token.hex}</span>
            </li>
          ))}
        </ul>
      </Figure>

      <Figure caption="Fig. 1.5b — Sign panel: the only object framed with the 2px heavy rule" className="md:col-span-6">
        <div className="border-2 border-ink">
          <Band bullet={<Bullet kind="index" value={2} />} title="Sequence" titleAs="p" />
          <div className="flex items-center justify-center px-6 py-16 text-muted">
            2px ink frame. Radius 0. No shadow.
          </div>
          <div className="flex h-8 items-center border-t border-rule px-4 type-micro text-muted">
            Fig. 2 — Sequence
          </div>
        </div>
      </Figure>
    </SpecimenSection>
  );
}
