import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping & Delivery",
  description: "Our shipping and delivery policy.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
