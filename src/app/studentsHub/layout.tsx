import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Students Hub",
  description: "A community hub for students.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
