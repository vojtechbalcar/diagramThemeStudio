import { Arrow, type ArrowDirection } from "@/components/system/arrow";
import { ArrowTile } from "@/components/system/arrow-tile";
import { Button } from "@/components/system/button";
import { TextLink } from "@/components/system/text-link";
import { Figure } from "./figure";
import { SpecimenSection } from "./specimen-section";

const DIRECTIONS: readonly { direction: ArrowDirection; degrees: number }[] = [
  { direction: "e", degrees: 0 },
  { direction: "se", degrees: 45 },
  { direction: "s", degrees: 90 },
  { direction: "sw", degrees: 135 },
  { direction: "w", degrees: 180 },
  { direction: "nw", degrees: 225 },
  { direction: "n", degrees: 270 },
  { direction: "ne", degrees: 315 },
];

export function ArrowSection() {
  return (
    <SpecimenSection
      id="arrows"
      intro="One arrow, drawn once: a 3px shaft and a 90° head with 9px arms, square caps, mitred join. It turns in 45° steps and nothing else."
    >
      <Figure caption="Fig. 1.7a — The eight directions, clockwise from east" className="lg:col-span-6">
        <ul className="flex flex-wrap gap-x-8 gap-y-6 border-t border-rule pt-6">
          {DIRECTIONS.map(({ direction, degrees }) => (
            <li key={direction} className="flex flex-col items-start gap-2">
              <Arrow direction={direction} size={48} />
              <span className="type-mono-small text-muted tabular-nums">{degrees}°</span>
            </li>
          ))}
        </ul>
      </Figure>

      <Figure caption="Fig. 1.7b — Tiles at 48 and 24, the inverted tile in a primary button, an inline link" className="lg:col-span-6">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-6 border-t border-rule pt-6">
          <ArrowTile size={48} />
          <ArrowTile size={24} />
          <Button arrow tabIndex={-1} inert>
            Export
          </Button>
          <TextLink href="#controls" arrow>
            See the controls
          </TextLink>
        </div>
      </Figure>
    </SpecimenSection>
  );
}
