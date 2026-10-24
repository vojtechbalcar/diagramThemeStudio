import type { ComponentType } from "react";
import { SymbolClose } from "@/components/system/symbol-close";
import { SymbolCopy } from "@/components/system/symbol-copy";
import { SymbolFail } from "@/components/system/symbol-fail";
import type { SymbolProps } from "@/components/system/symbol-frame";
import { SymbolLargeOnly } from "@/components/system/symbol-large-only";
import { SymbolMinus } from "@/components/system/symbol-minus";
import { SymbolMoon } from "@/components/system/symbol-moon";
import { SymbolPass } from "@/components/system/symbol-pass";
import { SymbolPlus } from "@/components/system/symbol-plus";
import { SymbolSun } from "@/components/system/symbol-sun";
import { SymbolSwap } from "@/components/system/symbol-swap";
import { SymbolWarning } from "@/components/system/symbol-warning";
import { VerdictSymbol } from "@/components/system/verdict-symbol";
import { contrastRatio, formatRatio, verdict } from "@/lib/contrast/wcag";
import { SAMPLE_PAIRS } from "@/lib/system/specimen";
import { Figure } from "./figure";
import { SpecimenSection } from "./specimen-section";

const SYMBOLS: readonly { name: string; meaning: string; Symbol: ComponentType<SymbolProps> }[] = [
  { name: "Pass", meaning: "Contrast pass", Symbol: SymbolPass },
  { name: "Large-only", meaning: "Passes for large text only", Symbol: SymbolLargeOnly },
  { name: "Fail", meaning: "Contrast fail", Symbol: SymbolFail },
  { name: "Copy", meaning: "Copy to clipboard", Symbol: SymbolCopy },
  { name: "Plus", meaning: "Add token", Symbol: SymbolPlus },
  { name: "Minus", meaning: "Remove token", Symbol: SymbolMinus },
  { name: "Close", meaning: "Close a dialog or drawer", Symbol: SymbolClose },
  { name: "Swap", meaning: "Swap surface", Symbol: SymbolSwap },
  { name: "Sun", meaning: "Light mode", Symbol: SymbolSun },
  { name: "Moon", meaning: "Dark mode", Symbol: SymbolMoon },
  { name: "Warning", meaning: "Parse warning", Symbol: SymbolWarning },
];

export function SymbolSection() {
  return (
    <SpecimenSection
      id="symbols"
      intro="A closed set on a 24px grid, 2px stroke, square caps. Pass and fail always come with the ratio, never colour alone."
    >
      <Figure caption="Fig. 1.8a — The symbol set at twice and at actual size" className="col-span-12">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4 xl:grid-cols-6">
          {SYMBOLS.map(({ name, meaning, Symbol }) => (
            <li key={name} className="border-t border-rule pt-4">
              <div className="flex items-end gap-4">
                <Symbol size={48} />
                <Symbol />
              </div>
              <p className="mt-3 type-heading">{name}</p>
              <p className="type-small text-muted">{meaning}</p>
            </li>
          ))}
        </ul>
      </Figure>

      <Figure
        caption="Fig. 1.8b — Contrast annotations (§3.5): symbol, ratio, pair. Ratios are truncated to one decimal."
        className="lg:col-span-6"
      >
        <ul className="border-t border-rule">
          {SAMPLE_PAIRS.map((pair) => {
            const ratio = contrastRatio(pair.text, pair.fill);
            return (
              <li key={pair.name} className="flex h-12 items-center gap-2 border-b border-rule">
                <VerdictSymbol verdict={verdict(ratio)} />
                <span className="w-12 text-right type-mono tabular-nums">{formatRatio(ratio)}</span>
                <span className="type-small">{pair.name}</span>
              </li>
            );
          })}
        </ul>
      </Figure>
    </SpecimenSection>
  );
}
