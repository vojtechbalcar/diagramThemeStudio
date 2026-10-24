import Link from "next/link";
import type { ReactNode } from "react";
import { Band } from "./band";
import { ModeToggle } from "./mode-toggle";
import { AccountNav } from "@/components/accounts/account-nav";

export type SystemBandProps = {
  /** Shown after the product name in muted band text, e.g. the set name. */
  subtitle?: ReactNode;
  /** Actions before the mode toggle. */
  children?: ReactNode;
};

/** The band at the top of every page (design.md §3.1). */
export function SystemBand({ subtitle, children }: SystemBandProps) {
  return (
    <Band
      as="header"
      titleAs="div"
      title={
        <span className="flex min-w-0 items-baseline gap-2">
          <Link href="/" className="decoration-1 underline-offset-3 hover:underline">
            Linework
          </Link>
          {subtitle ? <span className="min-w-0 truncate type-body text-muted">{subtitle}</span> : null}
        </span>
      }
    >
      {children}
      <AccountNav />
      <ModeToggle />
    </Band>
  );
}
