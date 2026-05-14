import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your zeroGravity dashboard and progress.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
