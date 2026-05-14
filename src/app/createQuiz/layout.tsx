import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Quiz",
  description: "Create a new quiz on zeroGravity.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
