import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notes",
  description: "Access your notes and study materials.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
