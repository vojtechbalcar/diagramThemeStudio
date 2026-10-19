import { Band } from "@/components/system/band";
import { Bullet } from "@/components/system/bullet";
import { SecondaryBand } from "@/components/system/secondary-band";
import { SymbolFail } from "@/components/system/symbol-fail";
import { SymbolPass } from "@/components/system/symbol-pass";
import { semanticToken } from "@/lib/system/palette";
import { Figure } from "./figure";
import { SpecList } from "./spec-list";
import { SpecimenSection } from "./specimen-section";

const BAND = semanticToken("--lw-band");
const BAND_RULE = semanticToken("--lw-band-rule");
const BAND_2 = semanticToken("--lw-band-2");

export function BandSection() {
  return (
    <SpecimenSection
      id="band"
      intro="A band marks the top of a unit: the app, a panel, a diagram card, the export drawer. Nowhere else."
    >
      <Figure caption="Fig. 1.4a — Card bands: index bullet, name, worst contrast result" className="lg:col-span-8">
        <div className="flex flex-col gap-6">
          <Band bullet={<Bullet kind="index" value={1} />} title="Flowchart" titleAs="p">
            <SymbolPass label="Passes" />
            <span className="type-mono tabular-nums">3</span>
          </Band>
          <Band bullet={<Bullet kind="index" value={3} />} title="Entity relationship" titleAs="p">
            <SymbolFail label="Fails" />
            <span className="type-mono tabular-nums">1</span>
          </Band>
        </div>
      </Figure>
      <Figure caption="Fig. 1.4b — Band measurements" className="lg:col-span-4">
        <SpecList
          items={[
            { term: "Height", value: "48px", mono: true },
            { term: "Pinstripe", value: "2px, 6px from the top" },
            { term: "Padding", value: "16px", mono: true },
            { term: "Text", value: "band, 20/24, 700" },
            { term: "Dark mode", value: `${BAND.dark}, 1px ${BAND_RULE.dark} rule`, mono: true },
          ]}
        />
      </Figure>

      <Figure caption="Fig. 1.4c — Secondary bands inside a panel" className="lg:col-span-8">
        <div className="flex flex-col gap-6">
          <SecondaryBand title="Colours" titleAs="p">
            <span className="type-mono-small tabular-nums">6</span>
          </SecondaryBand>
          <SecondaryBand title="Typography" titleAs="p">
            <span className="type-mono-small tabular-nums">2</span>
          </SecondaryBand>
        </div>
      </Figure>
      <Figure caption="Fig. 1.4d — Secondary band measurements" className="lg:col-span-4">
        <SpecList
          items={[
            { term: "Height", value: "32px", mono: true },
            { term: "Pinstripe", value: "None" },
            { term: "Text", value: "small, 13/16, 600" },
            { term: "Fill", value: `${BAND_2.light} light, ${BAND_2.dark} dark`, mono: true },
          ]}
        />
      </Figure>
    </SpecimenSection>
  );
}
