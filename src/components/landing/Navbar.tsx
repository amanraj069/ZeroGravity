"use client";

import Link from "next/link";
import Image from "next/image";
import { memo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";
import StreakIcon from "@/components/StreakIcon";
import { getBorderStyle, getAnimationClass } from "@/services/shopService";
import {
  Menu,
  X,
  Home as HomeIcon,
  LayoutDashboard,
  Target,
  BrainCircuit,
  FileText,
  GraduationCap,
  ShoppingBag,
  User,
  LogOut,
} from "lucide-react";

function Navbar() {
  const { isLoggedIn, isLoading, logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-white/20 dark:border-white/10 z-50 shadow-lg shadow-black/5 dark:shadow-black/20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <Link
            href="/"
            className="text-xl sm:text-2xl font-light text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ZeroGravity
          </Link>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <ThemeToggle />
            {!isLoading && isLoggedIn && (
              <>
                <StreakIcon />
                <NotificationBell />
              </>
            )}
            {!isLoading && (
              <>
                {isLoggedIn ? (
                  <>
                    {/* Desktop: Show Goals, Dashboard and Profile links */}
                    <Link
                      href="/dashboard/goals"
                      className="hidden sm:inline-block text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-xs sm:text-sm px-2 sm:px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg"
                    >
                      Goals
                    </Link>
                    <Link
                      href="/dashboard"
                      className="hidden sm:inline-block text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-xs sm:text-sm px-2 sm:px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="hidden sm:inline-block text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-xs sm:text-sm px-2 sm:px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg"
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
                      className="hidden sm:inline-block bg-black dark:bg-white text-white dark:text-black px-2 sm:px-4 py-2 text-xs sm:text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors rounded-lg"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/about"
                      className="text-black dark:text-white hover:text-gray-800 dark:hover:text-gray-300 text-xs sm:text-sm border border-gray-300 dark:border-gray-700 px-2 sm:px-4 py-2 hover:border-black dark:hover:border-gray-500 transition-colors rounded-lg"
                    >
                      About
                    </Link>
                    <Link
                      href="/login"
                      className="bg-black dark:bg-white text-white dark:text-black px-2 sm:px-4 py-2 text-xs sm:text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors rounded-lg"
                    >
                      Login
                    </Link>
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
              className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[60] sm:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
          )}

          {/* Slide-in Menu from Right */}
          <div
            className={`fixed top-0 right-0 h-full w-56 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-l-[0.5px] border-black/10 dark:border-white/5 z-[70] transform transition-transform duration-300 ease-in-out sm:hidden shadow-2xl shadow-black/20 ${isMenuOpen ? "translate-x-0" : "translate-x-full"
              }`}
          >
            <div className="flex flex-col h-full">
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b-[0.5px] border-black/10 dark:border-white/5">
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
                {/* Profile Header */}
                {user && (
                  <div className="flex flex-row items-center justify-start pt-6 pb-6 px-4 gap-6">
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="group cursor-pointer flex-shrink-0"
                    >
                      <div
                        className={`w-16 h-16 rounded-xl overflow-hidden bg-transparent flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${getAnimationClass(
                          user.equippedBorder || "",
                        )}`}
                        style={getBorderStyle(
                          user.equippedBorder || "default",
                          56,
                        )}
                      >
                        <div className="relative z-20 w-full h-full flex items-center justify-center overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
                          {user.profilePicture ? (
                            <Image
                              src={user.profilePicture}
                              alt={`${user.firstName || ""} ${user.lastName || ""}`}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-xl font-light text-gray-500 dark:text-gray-400">
                              {(user.firstName?.charAt(0) || user.username?.charAt(0) || "").toUpperCase()}
                              {(user.lastName?.charAt(0) || "").toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                    <div className="flex flex-col items-start overflow-hidden">
                      <Link
                        href="/profile"
                        onClick={() => setIsMenuOpen(false)}
                        className="group cursor-pointer"
                      >
                        <span className="text-sm font-medium text-black dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate block max-w-[120px]">
                          {user.firstName} {user.lastName}
                        </span>
                      </Link>
                      <div className="mt-1 -ml-1">
                        <StreakIcon />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Link
                    href="/"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <HomeIcon size={18} /> Home
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <LayoutDashboard size={18} /> Dashboard
                  </Link>
                  <Link
                    href="/dashboard/goals"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Target size={18} /> Goals
                  </Link>
                  <Link
                    href="/dashboard/quizzes?type=practice"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <BrainCircuit size={18} /> Quizzes
                  </Link>
                  <Link
                    href="/dashboard/notes"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <FileText size={18} /> Notes
                  </Link>
                  <Link
                    href="/dashboard/academia"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <GraduationCap size={18} /> Academia
                  </Link>
                  <Link
                    href="/shop"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <ShoppingBag size={18} /> Shop
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <User size={18} /> Profile
                  </Link>
                </div>
              </nav>

              {/* Logout Button at Bottom */}
              <div className="border-t-[0.5px] border-black/10 dark:border-white/5 p-4">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <LogOut size={18} /> Logout
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default memo(Navbar);
