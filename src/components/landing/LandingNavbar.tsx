"use client";

import Link from "next/link";
import { memo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import { Menu, X } from "lucide-react";

function LandingNavbar() {
  const { isLoggedIn, isLoading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
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
            {!isLoading && isLoggedIn && <NotificationBell />}
            {!isLoading && (
              <>
                {isLoggedIn ? (
                  <>
                    {/* Desktop: Show Leaderboard, Goals, Dashboard and Profile links */}
                    <Link
                      href="/leaderboard"
                      className="hidden sm:inline-block text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-xs sm:text-sm px-2 sm:px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Leaderboard
                    </Link>
                    <Link
                      href="/goals"
                      className="hidden sm:inline-block text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-xs sm:text-sm px-2 sm:px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Goals
                    </Link>
                    <Link
                      href="/dashboard"
                      className="hidden sm:inline-block text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-xs sm:text-sm px-2 sm:px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="hidden sm:inline-block text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-xs sm:text-sm px-2 sm:px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Profile
                    </Link>
                    {/* Mobile: Hamburger menu button */}
                    <button
                      onClick={() => setIsMenuOpen(true)}
                      className="sm:hidden text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white p-2"
                      aria-label="Open menu"
                    >
                      <Menu size={24} />
                    </button>
                    <button
                      onClick={logout}
                      className="hidden sm:inline-block bg-black dark:bg-white text-white dark:text-black px-2 sm:px-4 py-2 text-xs sm:text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
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

      {/* Mobile Menu Overlay and Slide-in Menu */}
      {isLoggedIn && (
        <>
          {/* Overlay */}
          {isMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 sm:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
          )}

          {/* Slide-in Menu from Right */}
          <div
            className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 z-40 transform transition-transform duration-300 ease-in-out sm:hidden ${
              isMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-black dark:text-white">
                  Menu
                </h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white p-2"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/leaderboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                  >
                    Leaderboard
                  </Link>
                  <Link
                    href="/goals"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                  >
                    Goals
                  </Link>
                  <Link
                    href="/academia"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                  >
                    Academia
                  </Link>
                  <Link
                    href="/shop"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                  >
                    Shop
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                  >
                    Profile
                  </Link>
                </div>
              </nav>

              {/* Logout Button at Bottom */}
              <div className="border-t border-gray-200 dark:border-gray-800 p-4">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                  }}
                  className="w-full px-4 py-3 text-left text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default memo(LandingNavbar);
