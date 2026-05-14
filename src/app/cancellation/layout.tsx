import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cancellation & Refund",
  description: "Our cancellation and refund policy.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
