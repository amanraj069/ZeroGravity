import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quizzes",
  description: "Take quizzes and test your knowledge.",
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
