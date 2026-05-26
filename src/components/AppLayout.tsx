"use client";

import { usePathname } from "next/navigation";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  const isNotesPage =
    pathname?.startsWith("/notes") || pathname?.startsWith("/dashboard/notes");
  const isHostedPage = pathname?.startsWith("/hosted");
  const isTakeQuizPage = pathname?.includes("/take");
  const isFullScreenPage = isNotesPage || isHostedPage || isTakeQuizPage;
  const hideNavigation =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    isTakeQuizPage;

  return (
    <div
      className={`flex flex-col bg-transparent ${isFullScreenPage ? "h-[100dvh] overflow-hidden" : "min-h-screen"
        }`}
    >
      {!hideNavigation && <LandingNavbar />}
      <main
        className={`flex-grow flex flex-col ${!hideNavigation ? "pt-16" : ""} ${isFullScreenPage ? "overflow-hidden min-h-0" : ""}`}
      >
        {children}
      </main>

      {isFullScreenPage || hideNavigation ? null : <LandingFooter />}
    </div>
  );
}
