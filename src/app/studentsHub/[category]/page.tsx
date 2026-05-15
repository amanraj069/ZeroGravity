"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import BenefitsList from "@/components/studentsHub/BenefitsList";
import { BackButton } from "@/components/BackButton";
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
        {/* Header Section */}
        <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <BackButton />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-black dark:text-white leading-tight">
              {categoryInfo.title}
            </h1>
          </div>
          
          {/* Search Bar */}
          <div className="w-full md:w-72 lg:w-96 flex-shrink-0 relative">
            <input
              type="text"
              placeholder="Search benefits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 pr-10 border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 focus:ring-0 transition-all duration-300 font-light text-sm shadow-sm"
            />
            <svg
              className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white transition-colors p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
