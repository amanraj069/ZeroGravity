"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
// import { useAuth } from "@/contexts/AuthContext"; // Currently not used, keeping for future use

interface DashboardHeaderProps {
  onLogout: () => void;
}

export default function DashboardHeader({ onLogout }: DashboardHeaderProps) {
  // const { user } = useAuth(); // Currently not used

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-2xl font-light text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          ZeroGravity
        </Link>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Link
            href="/"
            className="text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 text-sm border border-gray-300 dark:border-gray-700 px-4 py-2 hover:border-black dark:hover:border-gray-500 transition-colors"
          >
            Home
          </Link>
          <button
            onClick={onLogout}
            className="text-white dark:text-black bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-sm border border-transparent dark:border-gray-700 px-4 py-2 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
