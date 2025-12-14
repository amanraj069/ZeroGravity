"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import BenefitsList from "@/components/studentsHub/BenefitsList";
import { travelBenefits } from "@/data/benefits/travel";
import { technologyBenefits } from "@/data/benefits/technology";
import { softwareBenefits } from "@/data/benefits/software";
import { entertainmentBenefits } from "@/data/benefits/entertainment";
import { fashionBenefits } from "@/data/benefits/fashion";
import { educationBenefits } from "@/data/benefits/education";
import { Benefit } from "@/components/studentsHub/BenefitsList";

const categoryData: Record<
  string,
  { title: string; description: string; benefits: Benefit[] }
> = {
  travel: {
    title: "Travel & Transportation",
    description: "Airlines, Railways, Bus services, Ride-sharing apps",
    benefits: travelBenefits,
  },
  technology: {
    title: "Technology & Electronics",
    description:
      "Laptops, phones, tablets, Audio devices, Computer accessories",
    benefits: technologyBenefits,
  },
  software: {
    title: "Software & Digital Tools",
    description:
      "Operating systems, Design software, Productivity tools, Cloud services",
    benefits: softwareBenefits,
  },
  entertainment: {
    title: "Entertainment & Streaming",
    description: "Music streaming, Video streaming, Gaming platforms",
    benefits: entertainmentBenefits,
  },
  fashion: {
    title: "Fashion & Lifestyle",
    description: "Clothing brands, Footwear, Beauty products, Accessories",
    benefits: fashionBenefits,
  },
  education: {
    title: "Education & Learning",
    description:
      "Online courses, E-learning platforms, Educational software, Books & subscriptions",
    benefits: educationBenefits,
  },
};

export default function CategoryPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const category = params?.category as string;
  const [searchQuery, setSearchQuery] = useState("");

  const categoryInfo = categoryData[category];

  // Filter benefits based on search query - must be called before any early returns
  const filteredBenefits = useMemo(() => {
    if (!categoryInfo) return [];
    if (!searchQuery.trim()) return categoryInfo.benefits;

    const query = searchQuery.toLowerCase().trim();
    return categoryInfo.benefits.filter(
      (benefit) =>
        benefit.title.toLowerCase().includes(query) ||
        benefit.description.toLowerCase().includes(query)
    );
  }, [categoryInfo, searchQuery]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  if (authLoading) {
    return (
      <ZeroGravityLoading
        title="Loading Category"
        subtitle="Preparing your benefits..."
        showNavigation={false}
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <ZeroGravityLoading
        title="Redirecting"
        subtitle="Redirecting to login..."
        showNavigation={false}
      />
    );
  }

  if (!categoryInfo) {
    return (
      <DashboardLayout>
        <div className="mt-4">
          <div className="mb-8">
            <Link
              href="/studentsHub"
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-4"
            >
              <span className="mr-2">←</span>
              Back to Students Hub
            </Link>
            <h1 className="text-4xl font-light text-black dark:text-white mb-2">
              Category Not Found
            </h1>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mt-4">
        <div className="mb-2 sm:mb-4 flex flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <Link
            href="/studentsHub"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors whitespace-nowrap text-sm sm:text-base flex-shrink-0"
          >
            <span className="mr-2">←</span>
            <span className="hidden sm:inline">Back to Students Hub</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="text-right flex-shrink-0 max-w-[60%] sm:max-w-none">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-light text-black dark:text-white mb-1 sm:mb-2 leading-tight">
              {categoryInfo.title}
            </h1>
            <p className="hidden sm:block text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 leading-tight">
              {categoryInfo.description}
            </p>
          </div>
        </div>

        {/* Search Bar - Desktop version */}
        <div className="hidden sm:block sticky top-[64px] z-20 bg-gray-100 dark:bg-gray-900 -mx-4 px-4 py-4 border-b border-gray-200 dark:border-gray-800 mb-6 shadow-sm">
          <div className="relative w-full max-w-6xl mx-auto">
            <input
              type="text"
              placeholder="Search benefits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-4 pl-14 pr-12 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-none text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-300 font-light text-base shadow-lg hover:shadow-xl focus:shadow-xl"
            />
            <svg
              className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar - Mobile version */}
        <div className="sm:hidden sticky top-[53px] z-20 bg-gray-100 dark:bg-gray-900 -mx-4 px-4 py-3 border-b border-gray-200 dark:border-gray-800 mb-6 shadow-sm">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search benefits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-11 pr-10 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-none text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-600 focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-300 font-light text-sm shadow-lg hover:shadow-xl focus:shadow-xl"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        <BenefitsList
          benefits={filteredBenefits}
          categoryTitle={categoryInfo.title}
        />
      </div>
    </DashboardLayout>
  );
}
