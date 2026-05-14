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

  const isNotesPage = pathname?.startsWith("/notes");
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      {!isAuthPage && <LandingNavbar />}
      <main className="flex-1 flex flex-col">{children}</main>

      {isHomePage ? (
        <Footer />
      ) : isNotesPage || isAuthPage ? null : (
        <SimpleFooter />
      )}
    </div>
  );
}
