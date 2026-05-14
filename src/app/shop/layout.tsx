import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse and purchase zeroGravity items.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
