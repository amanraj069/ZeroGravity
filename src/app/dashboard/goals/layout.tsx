import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Goals",
  description: "Track and manage your goals.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
