import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "See top performers on the zeroGravity leaderboard.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
