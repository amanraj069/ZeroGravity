import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new zeroGravity account.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div />}>{children}</Suspense>;
}
