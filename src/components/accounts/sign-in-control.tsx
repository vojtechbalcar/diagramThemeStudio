"use client";

import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/system/button";
import { useAccount } from "./account-provider";

export function SignInControl({ label = "Sign in" }: { label?: string }) {
  const { clerkEnabled } = useAccount();
  if (!clerkEnabled) return null;
  return <SignInButton mode="modal"><Button variant="secondary">{label}</Button></SignInButton>;
}
