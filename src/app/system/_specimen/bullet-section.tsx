import { Bullet, type BulletSize } from "@/components/system/bullet";
import { SAMPLE_TOKENS } from "@/lib/system/specimen";
import { Figure } from "./figure";
import { SpecimenSection } from "./specimen-section";

const SIZES: readonly { size: BulletSize; label: string; px: number }[] = [
  { size: "large", label: "Large", px: 32 },
  { size: "standard", label: "Standard", px: 24 },
  { size: "small", label: "Small", px: 16 },
];

const INDEX = [1, 2, 3, 4] as const;
const STEPS = [1, 2, 3] as const;

const USES = [
  {
    name: "Diagram index",
    note: "1 Flowchart, 2 Sequence, 3 Entity relationship, 4 Gantt",
    render: (size: BulletSize) => INDEX.map((n) => <Bullet key={n} kind="index" value={n} size={size} />),
  },
  {
    name: "Token",
    note: "Glyph is the role letter, black or white by contrast",
    render: (size: BulletSize) =>
      SAMPLE_TOKENS.map((token) => (
        <Bullet
          key={token.glyph}
          kind="token"
          glyph={token.glyph}
          color={token.hex}
          size={size}
          label={`${token.role}, ${token.hex}`}
        />
      )),
  },
  {
    name: "Step",
    note: "Add tokens, Map roles, Export",
    render: (size: BulletSize) => STEPS.map((n) => <Bullet key={n} kind="step" value={n} size={size} />),
  },
] as const;

export function BulletSection() {
  return (
    <SpecimenSection
      id="bullets"
      intro="A filled circle with a short identifier. Three uses and only three. Never words, and never a letter in an index bullet."
    >
      <Figure
        caption="Fig. 1.6 — Bullets at each size. The L and B fills sit close to black and white, so they get a ring on the page they would vanish into."
        className="col-span-12"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="h-8 border-b border-rule type-small text-muted">
                <th scope="col" className="w-[256px] pr-6 font-medium">
                  Use
                </th>
                {SIZES.map((s) => (
                  <th key={s.size} scope="col" className="pr-6 font-medium">
                    {s.label} <span className="type-mono-small">{s.px}px</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {USES.map((use) => (
                <tr key={use.name} className="border-b border-rule">
                  <th scope="row" className="py-4 pr-6 align-middle font-medium">
                    <span className="block type-heading">{use.name}</span>
                    <span className="block type-small text-muted">{use.note}</span>
                  </th>
                  {SIZES.map((s) => (
                    <td key={s.size} className="py-4 pr-6 align-middle">
                      <div className="flex items-center gap-2">{use.render(s.size)}</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Figure>
    </SpecimenSection>
  );
}
