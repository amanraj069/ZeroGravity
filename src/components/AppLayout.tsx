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

  const isNotesPage =
    pathname?.startsWith("/notes") || pathname?.startsWith("/dashboard/notes");
  const isHostedPage = pathname?.startsWith("/hosted");
  const isFullScreenPage = isNotesPage || isHostedPage;
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <div
      className={`flex flex-col bg-white dark:bg-gray-900 ${isFullScreenPage ? "h-[100dvh] overflow-hidden" : "min-h-screen"
        }`}
    >
      {!isAuthPage && <LandingNavbar />}
      <main
        className={`flex-grow flex flex-col ${!isAuthPage ? "pt-16" : ""} ${isFullScreenPage ? "overflow-hidden min-h-0" : ""}`}
      >
        {children}
      </main>

      {isHomePage ? (
        <Footer />
      ) : isFullScreenPage || isAuthPage ? null : (
        <SimpleFooter />
      )}
    </div>
  );
}
