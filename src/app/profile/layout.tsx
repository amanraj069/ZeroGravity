import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "View and edit your zeroGravity profile.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
