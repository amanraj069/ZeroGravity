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
  const isFullScreenPage = isNotesPage || isHostedPage;
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password";

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

      {isFullScreenPage || isAuthPage ? null : <LandingFooter />}
    </div>
  );
}
