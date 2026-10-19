import { Figure } from "./figure";
import { SpecList } from "./spec-list";
import { SpecimenSection } from "./specimen-section";

const MODULES = [
  { name: "Base unit", symbol: "u", value: 4, sample: "size-1" },
  { name: "Half module", symbol: "M/2", value: 24, sample: "size-6" },
  { name: "Band module", symbol: "M", value: 48, sample: "size-12" },
] as const;

const RULES = [
  { name: "Rule", value: 1, sample: "h-px" },
  { name: "Heavy rule", value: 2, sample: "h-[2px]" },
] as const;

const SCALE = [4, 8, 12, 16, 24, 32, 48, 64, 96] as const;

export function UnitSection() {
  return (
    <SpecimenSection
      id="unit"
      intro="All spacing is a multiple of the 4px unit. The 48px module sets the height of every band, every primary control and every token row."
    >
      <Figure caption="Fig. 1.1a — Unit, modules and rules" className="lg:col-span-5">
        <div className="border-t border-rule">
          {MODULES.map((module) => (
            <div key={module.name} className="flex items-center gap-4 border-b border-rule py-3">
              <div className="flex w-12 shrink-0 justify-center">
                <span className={`${module.sample} block bg-ink`} />
              </div>
              <p className="flex-1">
                {module.name} <span className="type-mono text-muted">{module.symbol}</span>
              </p>
              <p className="type-mono tabular-nums">{module.value}px</p>
            </div>
          ))}
          {RULES.map((rule) => (
            <div key={rule.name} className="flex h-12 items-center gap-4 border-b border-rule">
              <div className="w-12 shrink-0">
                <span className={`${rule.sample} block w-12 bg-ink`} />
              </div>
              <p className="flex-1">{rule.name}</p>
              <p className="type-mono tabular-nums">{rule.value}px</p>
            </div>
          ))}
        </div>
      </Figure>

      <Figure caption="Fig. 1.1b — Spacing scale. No other values exist." className="lg:col-span-4">
        <ol className="border-t border-rule">
          {SCALE.map((value) => (
            <li key={value} className="flex h-8 items-center gap-4 border-b border-rule">
              <span className="w-8 shrink-0 text-right type-mono tabular-nums">{value}</span>
              <span className="block h-2 bg-ink" style={{ width: value }} />
            </li>
          ))}
        </ol>
      </Figure>

      <Figure caption="Fig. 1.1c — Layout grid, 1280px and wider" className="lg:col-span-3">
        <SpecList
          items={[
            { term: "Columns", value: "12" },
            { term: "Gutters", value: "24px", mono: true },
            { term: "Margins", value: "24px", mono: true },
            { term: "Tokens", value: "Columns 1–3" },
            { term: "Canvas", value: "Columns 4–12" },
            { term: "Baseline", value: "4px", mono: true },
          ]}
        />
      </Figure>
    </SpecimenSection>
  );
}
