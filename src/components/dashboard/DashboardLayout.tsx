"use client";

import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className=" bg-white dark:bg-gray-900">
      <main className="max-w-6xl mx-auto px-4 py-4">
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
