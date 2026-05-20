import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Academia",
  description: "Academic resources and materials.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
