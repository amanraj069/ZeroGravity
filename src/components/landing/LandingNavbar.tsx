"use client";

import Link from "next/link";
import { memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";

function LandingNavbar() {
  const { isLoggedIn, isLoading, logout } = useAuth();
  return (
    <header className="sticky top-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-20">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-xl sm:text-2xl font-light text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          ZeroGravity
        </Link>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <ThemeToggle />
          {!isLoading && (
            <>
              {isLoggedIn ? (
                <>
                  <Link
                    href="/goals"
                    className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-xs sm:text-sm px-2 sm:px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Goals
                  </Link>
                  <Link
                    href="/quizzes"
                    className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-xs sm:text-sm px-2 sm:px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Quizzes
                  </Link>
                  <Link
                    href="/dashboard"
                    className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-xs sm:text-sm px-2 sm:px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="bg-black dark:bg-white text-white dark:text-black px-2 sm:px-4 py-2 text-xs sm:text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-black dark:text-white hover:text-gray-800 dark:hover:text-gray-300 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 hover:border-black dark:hover:border-gray-500 transition-colors"
                  >
                    Login
                  </Link>
                  <button
                    onClick={() => {
                      document.getElementById("waitlist")?.scrollIntoView({
                        behavior: "smooth",
                      });
                    }}
                    className="bg-black dark:bg-white text-white dark:text-black px-2 sm:px-4 py-2 text-xs sm:text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                  >
                    Join Waitlist
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default memo(LandingNavbar);
