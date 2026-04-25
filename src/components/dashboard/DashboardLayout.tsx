"use client";

import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="bg-gray-100 dark:bg-[#050710] min-h-screen pb-12 sm:pb-16 flex flex-col transition-colors duration-500">
      <main className="flex-1 max-w-6xl mx-auto lg:px-4 px-4 sm:px-6 py-2 sm:py-4 w-full">
        {children}

        {/* <div className="mt-12 text-center">
          <Link href="/" className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">
            ← Back to home
          </Link>
        </div> */}
      </main>
    </div>
  );
}
