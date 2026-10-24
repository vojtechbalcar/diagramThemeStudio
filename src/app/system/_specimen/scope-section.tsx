import { ArrowTile } from "@/components/system/arrow-tile";
import { Band } from "@/components/system/band";
import { Bullet } from "@/components/system/bullet";
import { Button } from "@/components/system/button";
import { IconButton } from "@/components/system/icon-button";
import { SymbolLargeOnly } from "@/components/system/symbol-large-only";
import { SymbolPass } from "@/components/system/symbol-pass";
import { SymbolPlus } from "@/components/system/symbol-plus";
import { SAMPLE_TOKENS } from "@/lib/system/specimen";
import { Figure } from "./figure";
import { SpecimenSection } from "./specimen-section";

/** The same six elements, unchanged, in every scope. */
function ScopeSample() {
  return (
    <>
      <Bullet kind="index" value={1} />
      <SymbolPass />
      <SymbolLargeOnly />
      <ArrowTile size={24} />
      <Button variant="text">
        Import
      </Button>
      <IconButton label="Add token">
        <SymbolPlus />
      </IconButton>
    </>
  );
}

function TokenRowSample({ inverted = false }: { inverted?: boolean }) {
  const token = SAMPLE_TOKENS[0];
  return (
    <div
      data-force="focus"
      className={`flex h-12 items-center gap-3 border-y border-rule px-4 focus-visible:-outline-offset-4 ${inverted ? "lw-inverted" : ""}`}
    >
      <Bullet kind="token" glyph={token.glyph} color={token.hex} label={`${token.role}, ${token.hex}`} />
      <span className="flex-1">{token.role.toLowerCase()}</span>
      <span className="type-mono">{token.hex}</span>
    </div>
  );
}

export function ScopeSection() {
  return (
    <SpecimenSection
      id="ink"
      intro="Ink is the foreground of whatever surface an element sits on. Bands and inverted elements redefine it for their contents, so no component asks where it is."
    >
      <Figure caption="Fig. 1.2c — Ink on the page" className="lg:col-span-4">
        <div inert className="flex h-12 items-center gap-2 border border-rule px-4">
          <ScopeSample />
        </div>
      </Figure>
      <Figure caption="Fig. 1.2d — Ink inside a band" className="lg:col-span-4">
        <div inert>
          <Band title="Band" titleAs="p">
            <ScopeSample />
          </Band>
        </div>
      </Figure>
      <Figure caption="Fig. 1.2e — Ink inside an inverted element" className="lg:col-span-4">
        <div inert className="lw-inverted">
          <div className="flex h-12 items-center gap-2 px-4">
            <ScopeSample />
          </div>
        </div>
      </Figure>

      <Figure caption="Fig. 1.2f — Focus ring, offset, on the page" className="md:col-span-6 lg:col-span-3">
        <div inert className="flex h-24 items-center">
          <Button variant="secondary" data-force="focus">
            Import
          </Button>
        </div>
      </Figure>
      <Figure caption="Fig. 1.2g — Focus ring on a band" className="md:col-span-6 lg:col-span-3">
        <div inert className="flex h-24 items-center">
          <Band title="Tokens" titleAs="p" className="w-full">
            <Button variant="text" data-force="focus">
              Share link
            </Button>
          </Band>
        </div>
      </Figure>
      <Figure caption="Fig. 1.2h — Inset ring, full-width row" className="md:col-span-6 lg:col-span-3">
        <div inert className="flex h-24 items-center">
          <div className="w-full">
            <TokenRowSample />
          </div>
        </div>
      </Figure>
      <Figure caption="Fig. 1.2i — Inset ring, inverted row" className="md:col-span-6 lg:col-span-3">
        <div inert className="flex h-24 items-center">
          <div className="w-full">
            <TokenRowSample inverted />
          </div>
        </div>
      </Figure>
    </SpecimenSection>
  );
}
