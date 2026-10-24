"use client";

import { ButtonLink } from "@/components/system/button-link";
import { useAccount } from "./account-provider";

export function AccountNav() {
  const { state } = useAccount();
  if (state.status !== "ready" || !state.account.available) return null;
  return <ButtonLink href="/sets" variant="text"><span className="hidden md:inline">Saved sets</span><span className="md:hidden">Sets</span></ButtonLink>;
}
