import type { ReactNode } from "react";
import { Button } from "@/components/system/button";
import { IconButton } from "@/components/system/icon-button";
import { Input } from "@/components/system/input";
import { Segmented } from "@/components/system/segmented";
import { SymbolPlus } from "@/components/system/symbol-plus";
import { SymbolWarning } from "@/components/system/symbol-warning";
import { Toggle } from "@/components/system/toggle";
import { Figure } from "./figure";
import { SpecimenSection } from "./specimen-section";
import { StateCell } from "./state-cell";

const SURFACES = [
  { value: "paper", label: "Paper" },
  { value: "ink", label: "Ink" },
  { value: "brand", label: "Brand" },
] as const;

type Forced = "hover" | "active" | "focus";

type ControlRowProps = {
  name: string;
  spec: string;
  children: ReactNode;
};

function ControlRow({ name, spec, children }: ControlRowProps) {
  return (
    <div className="grid grid-cols-12 gap-x-6 gap-y-4 border-b border-rule py-6">
      <div className="col-span-12 lg:col-span-3">
        <h3 className="type-heading">{name}</h3>
        <p className="mt-1 type-small text-muted">{spec}</p>
      </div>
      <div className="col-span-12 flex flex-wrap gap-x-8 gap-y-6 lg:col-span-9">{children}</div>
    </div>
  );
}

/** Default (live), hover, pressed, focus and disabled for one button look. */
function ButtonStates({ render }: { render: (force?: Forced, disabled?: boolean) => ReactNode }) {
  return (
    <>
      <StateCell state="Default" live>
        {render()}
      </StateCell>
      <StateCell state="Hover">{render("hover")}</StateCell>
      <StateCell state="Pressed">{render("active")}</StateCell>
      <StateCell state="Focus">{render("focus")}</StateCell>
      <StateCell state="Disabled">{render(undefined, true)}</StateCell>
    </>
  );
}

export function ControlSection() {
  return (
    <SpecimenSection
      id="controls"
      intro="The Default column is live; try it with the keyboard. The other columns force a state so it can be reviewed, and do not respond to input."
    >
      <Figure caption="Fig. 3.9 — Every control in every state" className="col-span-12">
        <div className="border-t border-rule">
          <ControlRow name="Primary button" spec="48px, ink fill, body 700. Pressed moves 1px down.">
            <ButtonStates
              render={(force, disabled) => (
                <Button data-force={force} disabled={disabled}>
                  Export
                </Button>
              )}
            />
          </ControlRow>

          <ControlRow name="Primary with arrow tile" spec="Inverted 48px tile, flush right.">
            <ButtonStates
              render={(force, disabled) => (
                <Button arrow data-force={force} disabled={disabled}>
                  Open the editor
                </Button>
              )}
            />
          </ControlRow>

          <ControlRow name="Secondary button" spec="48px, 2px ink frame, body 700.">
            <ButtonStates
              render={(force, disabled) => (
                <Button variant="secondary" data-force={force} disabled={disabled}>
                  Import
                </Button>
              )}
            />
          </ControlRow>

          <ControlRow name="Secondary, half module" spec="24px, 2px ink frame, small 700.">
            <ButtonStates
              render={(force, disabled) => (
                <Button variant="secondary" size="half" data-force={force} disabled={disabled}>
                  Reset
                </Button>
              )}
            />
          </ControlRow>

          <ControlRow name="Destructive" spec="Signal frame and text. Always confirms in a dialog.">
            <ButtonStates
              render={(force, disabled) => (
                <Button variant="destructive" data-force={force} disabled={disabled}>
                  Delete set
                </Button>
              )}
            />
          </ControlRow>

          <ControlRow name="Text button" spec="Ink 600, underline on hover only.">
            <ButtonStates
              render={(force, disabled) => (
                <Button variant="text" data-force={force} disabled={disabled}>
                  Share link
                </Button>
              )}
            />
          </ControlRow>

          <ControlRow name="Icon button" spec="24px; inverts on hover and press.">
            <ButtonStates
              render={(force, disabled) => (
                <IconButton label="Add token" data-force={force} disabled={disabled}>
                  <SymbolPlus />
                </IconButton>
              )}
            />
          </ControlRow>

          <ControlRow name="Input" spec="48px, recessed, 1px bottom rule; 2px ink rule on focus.">
            <StateCell state="Default" live>
              <label className="w-[240px]">
                <span className="sr-only">Hex value</span>
                <Input mono defaultValue="#2F5BD3" />
              </label>
            </StateCell>
            <StateCell state="Placeholder">
              <div className="w-[240px]">
                <Input aria-label="Set name" placeholder="Untitled set" />
              </div>
            </StateCell>
            <StateCell state="Focus">
              <div className="w-[240px]">
                <Input aria-label="Hex value" mono defaultValue="#2F5BD3" data-force="focus" />
              </div>
            </StateCell>
            <StateCell state="Invalid">
              <div className="w-[240px]">
                <Input aria-label="Hex value" mono defaultValue="#2F5BD" aria-invalid />
                <p className="mt-2 flex items-center gap-1 type-small">
                  <SymbolWarning className="text-signal" />
                  Not a hex colour. Use #RRGGBB.
                </p>
              </div>
            </StateCell>
            <StateCell state="Disabled">
              <div className="w-[240px]">
                <Input aria-label="Hex value" mono defaultValue="#2F5BD3" disabled />
              </div>
            </StateCell>
          </ControlRow>

          <ControlRow name="Input, dense" spec="32px, for tables.">
            <StateCell state="Default" live>
              <label className="w-[160px]">
                <span className="sr-only">Font size</span>
                <Input density="dense" mono defaultValue="14" />
              </label>
            </StateCell>
            <StateCell state="Focus">
              <div className="w-[160px]">
                <Input aria-label="Font size" density="dense" mono defaultValue="14" data-force="focus" />
              </div>
            </StateCell>
            <StateCell state="Disabled">
              <div className="w-[160px]">
                <Input aria-label="Font size" density="dense" mono defaultValue="14" disabled />
              </div>
            </StateCell>
          </ControlRow>

          <ControlRow name="Toggle" spec="48×24 track, square 16px thumb travelling 24px.">
            <StateCell state="Default" live>
              <label className="flex items-center gap-3">
                <Toggle defaultChecked />
                Show contrast
              </label>
            </StateCell>
            <StateCell state="Off">
              <Toggle aria-label="Show contrast" />
            </StateCell>
            <StateCell state="On">
              <Toggle aria-label="Show contrast" defaultChecked />
            </StateCell>
            <StateCell state="Focus">
              <Toggle aria-label="Show contrast" defaultChecked data-force="focus" />
            </StateCell>
            <StateCell state="Disabled, off">
              <Toggle aria-label="Show contrast" disabled />
            </StateCell>
            <StateCell state="Disabled, on">
              <Toggle aria-label="Show contrast" disabled defaultChecked />
            </StateCell>
          </ControlRow>

          <ControlRow name="Segmented control" spec="Joined segments, selected inverted, inset focus ring.">
            <StateCell state="Default" live>
              <Segmented name="surface-live" legend="Preview surface" options={SURFACES} defaultValue="paper" />
            </StateCell>
            <StateCell state="Disabled">
              <Segmented
                name="surface-disabled"
                legend="Preview surface"
                options={SURFACES}
                defaultValue="ink"
                disabled
              />
            </StateCell>
          </ControlRow>
        </div>
      </Figure>
    </SpecimenSection>
  );
}
