import { VerdictSymbol } from "@/components/system/verdict-symbol";
import { contrastRatio, formatRatio, verdict } from "@/lib/contrast/wcag";
import { PALETTE, SEMANTIC } from "@/lib/system/palette";
import { Figure } from "./figure";
import { SpecimenSection } from "./specimen-section";

const PAGE_WHITE = PALETTE[1].hex;
const PAGE_BLACK = PALETTE[0].hex;

function RatioLine({ colour, against, label }: { colour: string; against: string; label: string }) {
  const ratio = contrastRatio(colour, against);
  return (
    <li className="flex items-center gap-2">
      <VerdictSymbol verdict={verdict(ratio)} />
      <span className="w-12 text-right type-mono tabular-nums">{formatRatio(ratio)}</span>
      <span className="type-small text-muted">{label}</span>
    </li>
  );
}

function Swatch({ hex }: { hex: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="block size-4 shrink-0 border border-rule" style={{ backgroundColor: hex }} />
      <span className="type-mono">{hex}</span>
    </span>
  );
}

export function ColourSection() {
  return (
    <SpecimenSection
      id="colour"
      intro="The interface is black, white and greys. Signal red marks failure and destruction, nothing else. Anything chromatic on screen came from the user's tokens."
    >
      <Figure
        caption="Fig. 1.2a — Interface palette, with each colour's contrast as text on white and on black"
        className="col-span-12"
      >
        <ul className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4 xl:grid-cols-7">
          {PALETTE.map((colour) => (
            <li key={colour.token} className="min-w-0">
              <div className="h-24 border border-rule" style={{ backgroundColor: colour.hex }} />
              <p className="mt-3 type-mono">{colour.hex}</p>
              <p className="type-mono-small text-muted">{colour.token}</p>
              <p className="mt-1 min-h-8 type-small">{colour.use}</p>
              <ul className="mt-3 flex flex-col gap-1">
                <RatioLine colour={colour.hex} against={PAGE_WHITE} label="on white" />
                <RatioLine colour={colour.hex} against={PAGE_BLACK} label="on black" />
              </ul>
            </li>
          ))}
        </ul>
      </Figure>

      <Figure
        caption="Fig. 1.2b — Semantic tokens. Components only use these; the mode picks the column."
        className="col-span-12"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="h-8 border-b border-rule type-small text-muted">
                <th scope="col" className="pr-6 font-medium">
                  Token
                </th>
                <th scope="col" className="pr-6 font-medium">
                  Light
                </th>
                <th scope="col" className="pr-6 font-medium">
                  Dark
                </th>
                <th scope="col" className="font-medium">
                  Use
                </th>
              </tr>
            </thead>
            <tbody>
              {SEMANTIC.map((token) => (
                <tr key={token.token} className="h-12 border-b border-rule">
                  <th scope="row" className="pr-6 type-mono">
                    {token.token}
                  </th>
                  <td className="pr-6">
                    <Swatch hex={token.light} />
                  </td>
                  <td className="pr-6">
                    <Swatch hex={token.dark} />
                  </td>
                  <td>{token.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Figure>
    </SpecimenSection>
  );
}
