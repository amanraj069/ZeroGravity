"use client";

import {
  AnimatedSection,
  AnimatedFeatureGrid,
  AnimatedFeatureItem,
} from "@/components/AnimatedSection";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  const versions = [
    {
      version: "Beta 1",
      date: "December 15, 2025",
      status: "Current",
      features: [
        "Enhanced dashboard with real-time updates",
        "Advanced goal tracking and analytics",
        "Student hub with category-based content",
        "Shop integration with rewards",
        "Leaderboard & Notification system",
        "Academia management",
        "Daily tasks & streaks",
        "Profile customization & Dark mode support",
        "Enhanced authentication system",
      ],
    },
    {
      version: "1.0.0",
      date: "2023",
      status: "Pre Beta",
      features: [
        "Initial release",
        "User authentication",
        "Basic goal tracking",
        "Landing page",
        "Waitlist system",
      ],
    },
  ];

  const upcomingFeatures = [
    {
      title: "AI-Powered Insights",
      description:
        "Get personalized recommendations and insights based on your goals and progress.",
      status: "In Development",
      eta: "Q1 2026",
    },
    {
      title: "Custom Themes and Titles",
      description:
        "Personalize your ZeroGravity experience with custom color themes, layouts and flex with titles.",
      status: "In Development",
      eta: "Q1 2026",
    },
    {
      title: "Mobile App",
      description:
        "Native iOS and Android applications for on-the-go productivity",
      status: "In Development",
      eta: "Q2 2026",
    },
    {
      title: "Social Features",
      description:
        "Connect with friends, share achievements, and compete in challenges",
      status: "Planned",
      eta: "Q2 2026",
    },
    {
      title: "Advanced Analytics",
      description:
        "Comprehensive analytics dashboard with detailed progress tracking and trends",
      status: "Planned",
      eta: "Q2 2026",
    },
    {
      title: "Integration Hub",
      description:
        "Connect with popular productivity tools like Notion, Todoist, and Google Calendar",
      status: "Planned",
      eta: "Q3 2026",
    },
  ];

  const developers = [
    {
      name: "Aman Raj",
      role: "Founder & Lead Developer",
      email: "amanraj3567@gmail.com",
      github: "https://github.com/amanraj069",
      linkedin: "https://www.linkedin.com/in/amanraj-iiits",
      medium: "https://medium.com/@amanraj3567",
      bio: "3rd year Btech CSE at IIIT Sricity. Building ZeroGravity as a feature-rich productivity platform that eliminates friction while maintaining healthy competition and proper tracking. Experience with complex task management systems revealed most tools add complexity rather than reducing it. ZeroGravity combines comprehensive functionality with minimalist design - robust goal tracking, competitive elements, and detailed progress monitoring.",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <AnimatedSection className="mb-2 sm:mb-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-black dark:text-white mb-2 sm:mb-2">
            About ZeroGravity
          </h1>
        </AnimatedSection>

        {/* Developer Section - Moved to Top */}
        <AnimatedSection className="mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-black dark:text-white mb-8 sm:mb-12">
            Developer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6 sm:gap-8">
            {developers.map((dev, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6 },
                  },
                }}
                className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 transition-colors overflow-hidden relative group"
                onClick={() =>
                  window.open(
                    "https://portfolio-aman-raj.vercel.app/",
                    "_blank"
                  )
                }
              >
                {/* Hover text - Click for portfolio */}
                <div className="absolute top-4 right-4 md:top-6 md:right-[280px] z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm">
                    Click for portfolio
                  </span>
                </div>

                <div className="flex flex-col md:flex-row">
                  {/* Image - Top on mobile, Right side on desktop with full height */}
                  <div className="w-full md:w-64 md:flex-shrink-0 order-1 md:order-2">
                    <div className="relative w-full h-64 md:h-full min-h-[256px]">
                      <Image
                        src="https://portfolio-aman-raj.vercel.app/home/cover_me.JPG"
                        alt={dev.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 256px"
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-8 sm:p-10 order-2 md:order-1 cursor-pointer">
                    <h3 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-2">
                      {dev.name}
                    </h3>
                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-6">
                      {dev.role}
                    </p>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                      {dev.bio}
                    </p>
                    <div className="grid grid-cols-2 sm:flex sm:flex-row gap-4 sm:gap-6">
                      <a
                        href={dev.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center text-sm sm:text-base text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <svg
                          className="w-5 h-5 mr-2 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        GitHub
                      </a>
                      <a
                        href={dev.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center text-sm sm:text-base text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <svg
                          className="w-5 h-5 mr-2 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        LinkedIn
                      </a>
                      <a
                        href={`mailto:${dev.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center text-sm sm:text-base text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <svg
                          className="w-5 h-5 mr-2 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.904.732-1.636 1.636-1.636h.946l9.418 7.09 9.418-7.09h.946A1.636 1.636 0 0 1 24 5.457z" />
                        </svg>
                        Gmail
                      </a>
                      <a
                        href={dev.medium}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center text-sm sm:text-base text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <svg
                          className="w-5 h-5 mr-2 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
                        </svg>
                        Medium
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* Version History Section */}
        <AnimatedSection className="mb-16 sm:mb-20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-black dark:text-white mb-8 sm:mb-12">
            Version History
          </h2>
          <div className="space-y-8 sm:space-y-12">
            {versions.map((version, index) => (
              <motion.div
                key={version.version}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, delay: index * 0.1 },
                  },
                }}
                className="border-l-2 border-gray-300 dark:border-gray-700 pl-6 sm:pl-8 relative"
              >
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-black dark:bg-white border-2 border-white dark:border-gray-900" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-light text-black dark:text-white mb-1">
                      Version {version.version}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                      {version.date}
                    </p>
                  </div>
                  <span
                    className={`inline-block mt-2 sm:mt-0 px-3 py-1 text-xs sm:text-sm font-medium ${
                      version.status === "Current"
                        ? "bg-black dark:bg-white text-white dark:text-black"
                        : version.status === "Pre Beta"
                        ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {version.status}
                  </span>
                </div>
                <ul className="space-y-2 mt-4">
                  {version.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="text-sm sm:text-base text-gray-600 dark:text-gray-400 flex items-start"
                    >
                      <span className="mr-2 text-black dark:text-white">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>

        {/* Upcoming Features Section */}
        <AnimatedSection className="mb-16 sm:mb-20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-black dark:text-white mb-8 sm:mb-12">
            Upcoming Features
          </h2>
          <AnimatedFeatureGrid className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {upcomingFeatures.map((feature, index) => (
              <AnimatedFeatureItem key={index}>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 sm:p-8 border border-gray-200 dark:border-gray-700/50 h-full hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg sm:text-xl font-light text-black dark:text-white flex-1">
                      {feature.title}
                    </h3>
                    <span
                      className={`ml-3 px-2 py-1 text-xs font-medium whitespace-nowrap ${
                        feature.status === "In Development"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {feature.status}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {feature.description}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                    ETA: {feature.eta}
                  </p>
                </div>
              </AnimatedFeatureItem>
            ))}
          </AnimatedFeatureGrid>
        </AnimatedSection>

        {/* Footer CTA */}
        <AnimatedSection className="text-center">
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8 sm:pt-12">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-0 sm:mb-0">
                Want to see your name in Developer Section by Contributing?
              </p>
              <Link
                href="/contact"
                className="inline-block bg-black dark:bg-white text-white dark:text-black px-4 sm:px-6 py-1 sm:py-2 text-base sm:text-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                Drop your ideas here
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
