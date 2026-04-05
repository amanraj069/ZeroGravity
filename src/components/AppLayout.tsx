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
          ? "bg-muted"
          : isNotesPage
            ? "bg-background"
            : "bg-background"
      }`}
    >
      <LandingNavbar />
      <main className="flex-1 flex flex-col">{children}</main>

      {isHomePage ? (
        <Footer />
      ) : isNotesPage ? null : (
        <SimpleFooter />
      )}
    </div>
  );
}
