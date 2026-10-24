import type { ReactNode } from "react";

export type StateCellProps = {
  state: string;
  /** Forced states are pictures of a state: not focusable, not clickable. */
  live?: boolean;
  children: ReactNode;
};

/** One state of a control, labelled above. */
export function StateCell({ state, live = false, children }: StateCellProps) {
  return (
    <div className="min-w-0">
      <p className="mb-2 type-micro text-muted">{state}</p>
      <div inert={!live} className="flex min-h-12 items-center">
        {children}
      </div>
    </div>
  );
}
