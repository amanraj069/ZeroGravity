"use client";

import { usePathname } from "next/navigation";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import SimpleFooter from "@/components/landing/SimpleFooter";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  // Use LandingFooter for home page, SimpleFooter for all other pages
  const isHomePage = pathname === "/";
  const Footer = isHomePage ? LandingFooter : SimpleFooter;

  // Pages that should have gray background
  const grayBackgroundPages = [
    "/profile",
    "/goals",
    "/dashboard",
    "/shop",
    "/quizzes",
    "/academia",
    "/studentsHub",
    "/notes",
  ];
  const hasGrayBackground = grayBackgroundPages.some((page) =>
    pathname?.startsWith(page),
  );

  return (
    <div
      className={`min-h-screen flex flex-col ${
        hasGrayBackground
          ? "bg-gray-100 dark:bg-gray-900"
          : "bg-white dark:bg-gray-900"
      }`}
    >
      <LandingNavbar />
      <main className="flex-1 pb-16">{children}</main>
      <Footer />
    </div>
  );
}
