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
  ];
  const hasGrayBackground = grayBackgroundPages.some((page) =>
    pathname?.startsWith(page),
  );
  
  const isNotesPage = pathname?.startsWith("/notes");

  return (
    <div
      className={`min-h-screen flex flex-col ${
        hasGrayBackground
          ? "bg-gray-100 dark:bg-gray-900"
          : isNotesPage
          ? "bg-white dark:bg-[#0a0a0a]"
          : "bg-white dark:bg-gray-900"
      }`}
    >
      <LandingNavbar />
      <main className={`flex-1 ${isNotesPage ? "" : "pb-16"}`}>{children}</main>
      
      {isHomePage ? (
        <Footer />
      ) : isNotesPage ? (
        <SimpleFooter className="bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-gray-800" />
      ) : hasGrayBackground ? (
        <SimpleFooter className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800" />
      ) : (
        <SimpleFooter className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800" />
      )}
    </div>
  );
}
