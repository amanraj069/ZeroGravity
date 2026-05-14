import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join Quiz",
  description: "Join an existing quiz on zeroGravity.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
