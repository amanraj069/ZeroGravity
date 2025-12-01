"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { DashboardLayout } from "@/components/dashboard";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";

interface Category {
  title: string;
  description: string;
  url: string;
  lightGradient: string;
  darkGradient: string;
}

const categories: Category[] = [
  {
    title: "Travel & Transportation",
    description: "Airlines, Railways, Bus services, Ride-sharing apps",
    url: "/studentsHub/travel",
    lightGradient:
      "linear-gradient(135deg, #f5fbff 0%, #e0f2ff 50%, #fdf7ff 100%)",
    darkGradient:
      "radial-gradient(circle at top left, #172554 0%, #000000 50%)",
  },
  {
    title: "Technology & Electronics",
    description:
      "Laptops, phones, tablets, Audio devices, Computer accessories",
    url: "/studentsHub/technology",
    lightGradient:
      "linear-gradient(135deg, #f3f6ff 0%, #e1e6ff 40%, #f7f3ff 100%)",
    darkGradient:
      "radial-gradient(circle at top left, #1a0033 0%, #000000 50%)",
  },
  {
    title: "Software & Digital Tools",
    description:
      "Operating systems, Design software, Productivity tools, Cloud services",
    url: "/studentsHub/software",
    lightGradient:
      "linear-gradient(135deg, #f2fbff 0%, #e6f4ff 45%, #f3f0ff 100%)",
    darkGradient:
      "radial-gradient(circle at top left, #172554 0%, #000000 50%)",
  },
  {
    title: "Entertainment & Streaming",
    description: "Music streaming, Video streaming, Gaming platforms",
    url: "/studentsHub/entertainment",
    lightGradient:
      "linear-gradient(135deg, #fff5fb 0%, #ffe9f7 45%, #f4e8ff 100%)",
    darkGradient:
      "radial-gradient(circle at top left, #1a0033 0%, #000000 50%)",
  },
  {
    title: "Fashion & Lifestyle",
    description: "Clothing brands, Footwear, Beauty products, Accessories",
    url: "/studentsHub/fashion",
    lightGradient:
      "linear-gradient(135deg, #fff8f0 0%, #fdeee2 50%, #f8e8ff 100%)",
    darkGradient:
      "radial-gradient(circle at top left, #172554 0%, #000000 50%)",
  },
  {
    title: "Education & Learning",
    description:
      "Online courses, E-learning platforms, Educational software, Books & subscriptions",
    url: "/studentsHub/education",
    lightGradient:
      "linear-gradient(135deg, #f4fff6 0%, #e6faef 45%, #f2f5ff 100%)",
    darkGradient:
      "radial-gradient(circle at top left, #1a0033 0%, #000000 50%)",
  },
];

export default function StudentsHub() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const isLightTheme = theme === "light";

  // Generate random particle data once - fewer particles on left/right sides with random positions
  const particles = useMemo(() => {
    const topBottomParticles = 8; // More particles on top and bottom
    const leftRightParticles = 3; // Fewer particles on left and right
    const totalParticles = topBottomParticles * 2 + leftRightParticles * 2;

    return Array.from({ length: totalParticles }, (_, i) => {
      let left = "0%";
      let top = "0%";
      let isLeftRight = false;
      const randomPosition = Math.random(); // Random position along the side

      if (i < topBottomParticles) {
        // Top border - random positions
        left = `${randomPosition * 100}%`;
        top = "-6px";
      } else if (i < topBottomParticles + leftRightParticles) {
        // Right border - fewer particles, random positions
        left = "calc(100% + 2px)";
        top = `${randomPosition * 100}%`;
        isLeftRight = true;
      } else if (i < topBottomParticles * 2 + leftRightParticles) {
        // Bottom border - random positions
        left = `${randomPosition * 100}%`;
        top = "calc(100% + 2px)";
      } else {
        // Left border - fewer particles, random positions
        left = "-6px";
        top = `${randomPosition * 100}%`;
        isLeftRight = true;
      }

      return {
        left,
        top,
        size: isLeftRight ? 1 + Math.random() * 1.5 : 1.5 + Math.random() * 2.5, // Smaller on left/right
        delay: Math.random() * 2,
        duration: 1.5 + Math.random() * 1.5,
        opacity: isLeftRight ? 0.6 : 1, // Lower opacity on left/right
      };
    });
  }, []);

  // Generate random stars for each Verification Platform card
  const unidaysStars = useMemo(() => {
    return Array.from({ length: 40 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      delay: Math.random() * 3,
      twinkleDuration: 2 + Math.random() * 3,
      twinkleDelay: Math.random() * 2,
      moveX: (Math.random() - 0.5) * 40,
      moveY: (Math.random() - 0.5) * 40,
    }));
  }, []);

  const studentpeepsStars = useMemo(() => {
    return Array.from({ length: 40 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.8 + 0.2,
      delay: Math.random() * 3,
      twinkleDuration: 2 + Math.random() * 3,
      twinkleDelay: Math.random() * 2,
      moveX: (Math.random() - 0.5) * 40,
      moveY: (Math.random() - 0.5) * 40,
    }));
  }, []);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  if (authLoading) {
    return (
      <ZeroGravityLoading
        title="Loading Students Hub"
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

  return (
    <DashboardLayout>
      <div className="mt-4">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <span className="mr-2">←</span>
            Back to Dashboard
          </Link>
          <div className="text-left md:text-right">
            <h1 className="text-4xl font-light text-black dark:text-white mb-2">
              Students Hub
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Discover all the amazing benefits available to you
            </p>
          </div>
        </div>

        {/* Premium Tools Section - 2x2 Grid */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* GitHub Student Dev Pack */}
            <Link
              href="https://education.github.com/pack"
              target="_blank"
              rel="noopener noreferrer"
              className="block relative overflow-visible group w-full"
            >
              {/* Golden particles animation - random sparkles */}
              <div className="absolute -inset-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0">
                {particles.map((particle, i) => (
                  <div
                    key={i}
                    className="absolute bg-yellow-400 rounded-full"
                    style={{
                      left: particle.left,
                      top: particle.top,
                      width: `${particle.size}px`,
                      height: `${particle.size}px`,
                      opacity: particle.opacity,
                      boxShadow:
                        particle.opacity === 1
                          ? "0 0 6px rgba(250, 204, 21, 0.5)"
                          : "0 0 3px rgba(250, 204, 21, 0.3)",
                      animation: `sparkle-fade ${particle.duration}s ease-in-out infinite`,
                      animationDelay: `${particle.delay}s`,
                    }}
                  />
                ))}
              </div>

              <div className="border-2 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-5 hover:border-yellow-500 dark:hover:border-yellow-500 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/20 hover:scale-[1.02] relative z-10 h-full">
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-700 group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/30 transition-colors overflow-hidden">
                      <Image
                        src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                        alt="GitHub"
                        width={28}
                        height={28}
                        className="w-7 h-7 object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-light text-black dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors mb-1">
                        GitHub Student Dev Pack
                      </h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                        Exclusive developer tools and resources
                      </p>
                    </div>
                  </div>
                  <div className="text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transform group-hover:translate-x-1 transition-all duration-300 ml-4 flex-shrink-0">
                    →
                  </div>
                </div>
              </div>
            </Link>

            {/* Gemini Pro for Students */}
            <Link
              href="https://gemini.google/students/"
              target="_blank"
              rel="noopener noreferrer"
              className="block relative overflow-visible group w-full"
            >
              <div className="border-2 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-5 hover:border-yellow-500 dark:hover:border-yellow-500 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/20 hover:scale-[1.02] h-full">
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-700 group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/30 transition-colors overflow-hidden">
                      <Image
                        src="/benifits/gemini.png"
                        alt="Gemini"
                        width={28}
                        height={28}
                        className="w-7 h-7 object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-light text-black dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors mb-1">
                        Gemini Pro for Students
                      </h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                        Advanced AI assistance for students
                      </p>
                    </div>
                  </div>
                  <div className="text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transform group-hover:translate-x-1 transition-all duration-300 ml-4 flex-shrink-0">
                    →
                  </div>
                </div>
              </div>
            </Link>

            {/* Perplexity */}
            <Link
              href="https://plex.it/referrals/OGC3S7CZ"
              target="_blank"
              rel="noopener noreferrer"
              className="block relative overflow-visible group w-full"
            >
              <div className="border-2 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-5 hover:border-yellow-500 dark:hover:border-yellow-500 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/20 hover:scale-[1.02] h-full">
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-700 group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/30 transition-colors overflow-hidden">
                      <Image
                        src="/benifits/perp.png"
                        alt="Perplexity"
                        width={28}
                        height={28}
                        className="w-7 h-7 object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-light text-black dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors mb-1">
                        Perplexity Pro
                      </h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                        AI-powered research and answer engine
                      </p>
                    </div>
                  </div>
                  <div className="text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transform group-hover:translate-x-1 transition-all duration-300 ml-4 flex-shrink-0">
                    →
                  </div>
                </div>
              </div>
            </Link>

            {/* ChatGPT Go */}
            <Link
              href="https://chatgpt.com/#pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="block relative overflow-visible group w-full"
            >
              <div className="border-2 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-5 hover:border-yellow-500 dark:hover:border-yellow-500 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/20 hover:scale-[1.02] h-full">
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 flex items-center justify-center bg-gray-200 dark:bg-gray-700 group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/30 transition-colors overflow-hidden">
                      <Image
                        src={
                          theme === "light"
                            ? "/benifits/chatgpt_light.jpeg"
                            : "/benifits/chatgpt.png"
                        }
                        alt="ChatGPT"
                        width={28}
                        height={28}
                        className="w-7 h-7 object-contain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-light text-black dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors mb-1">
                        ChatGPT Go
                      </h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                        Free AI chatbot for students
                      </p>
                    </div>
                  </div>
                  <div className="text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transform group-hover:translate-x-1 transition-all duration-300 ml-4 flex-shrink-0">
                    →
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Verification Platforms Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-light text-black dark:text-white mb-4">
            Verification Platforms
          </h2>
          {/* CSS for star animations */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
              @keyframes verificationStarTwinkle {
                0%, 100% {
                  opacity: 0.2;
                }
                50% {
                  opacity: 1;
                }
              }
              
              @keyframes verificationStarFadeIn {
                0% {
                  opacity: 0;
                  transform: scale(0);
                }
                100% {
                  opacity: var(--verification-star-opacity);
                  transform: scale(1);
                }
              }
              
              .verification-star-base {
                animation: verificationStarFadeIn 0.5s ease-out forwards, verificationStarTwinkle var(--verification-twinkle-duration) ease-in-out infinite;
                animation-delay: var(--verification-appear-delay), var(--verification-twinkle-delay);
                opacity: 0;
                transform: scale(1) translate(0, 0);
                transition: transform 0.3s ease-out;
              }
              
              .verification-card:hover .verification-star-base {
                transform: scale(1) translate(var(--verification-move-x), var(--verification-move-y)) !important;
              }
            `,
            }}
          />

          <div className="flex gap-4">
            {/* UNiDAYS Card */}
            <Link
              href="https://www.myunidays.com/IN/en-IN"
              target="_blank"
              rel="noopener noreferrer"
              className="verification-card group relative w-1/2 overflow-hidden border-2 border-gray-300 dark:border-gray-700 bg-gray-800 dark:bg-black hover:border-gray-600 dark:hover:border-white transition-all duration-300 hover:shadow-xl hover:shadow-gray-500/20 dark:hover:shadow-white/20 hover:scale-[1.02]"
            >
              {/* Starfield Background */}
              <div className="absolute inset-0 bg-gray-800 dark:bg-black">
                {unidaysStars.map((star, index) => (
                  <div
                    key={index}
                    className="verification-star-base absolute rounded-full bg-white"
                    style={
                      {
                        left: star.left,
                        top: star.top,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        "--verification-star-opacity": `${star.opacity}`,
                        "--verification-appear-delay": `${star.delay * 0.1}s`,
                        "--verification-twinkle-duration": `${star.twinkleDuration}s`,
                        "--verification-twinkle-delay": `${star.twinkleDelay}s`,
                        "--verification-move-x": `${star.moveX}px`,
                        "--verification-move-y": `${star.moveY}px`,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>

              {/* Card Content */}
              <div className="relative z-10 p-6 flex items-center justify-center min-h-[100px]">
                <span className="text-xl font-light text-white group-hover:scale-105 transition-transform">
                  UNiDAYS
                </span>
              </div>
            </Link>

            {/* StudentPeeps Card */}
            <Link
              href="https://studentpeeps.club/"
              target="_blank"
              rel="noopener noreferrer"
              className="verification-card group relative w-1/2 overflow-hidden border-2 border-gray-300 dark:border-gray-700 bg-gray-800 dark:bg-black hover:border-gray-600 dark:hover:border-white transition-all duration-300 hover:shadow-xl hover:shadow-gray-500/20 dark:hover:shadow-white/20 hover:scale-[1.02]"
            >
              {/* Starfield Background */}
              <div className="absolute inset-0 bg-gray-800 dark:bg-black">
                {studentpeepsStars.map((star, index) => (
                  <div
                    key={index}
                    className="verification-star-base absolute rounded-full bg-white"
                    style={
                      {
                        left: star.left,
                        top: star.top,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        "--verification-star-opacity": `${star.opacity}`,
                        "--verification-appear-delay": `${star.delay * 0.1}s`,
                        "--verification-twinkle-duration": `${star.twinkleDuration}s`,
                        "--verification-twinkle-delay": `${star.twinkleDelay}s`,
                        "--verification-move-x": `${star.moveX}px`,
                        "--verification-move-y": `${star.moveY}px`,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>

              {/* Card Content */}
              <div className="relative z-10 p-6 flex items-center justify-center min-h-[100px]">
                <span className="text-xl font-light text-white group-hover:scale-105 transition-transform">
                  StudentPeeps
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Categories Section */}
        <div>
          <h2 className="text-3xl font-light text-black dark:text-white mb-8">
            Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <Link
                key={index}
                href={category.url}
                className={`overflow-hidden border-2 hover:border-gray-400/70 dark:hover:border-white/30 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02] transition-all duration-300 group cursor-pointer relative min-h-[120px] sm:min-h-[180px] ${
                  isLightTheme
                    ? "text-gray-900 border-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
                    : "text-white border-gray-800/60"
                }`}
                data-testid="students-hub-category-card"
                style={{
                  background: isLightTheme
                    ? category.lightGradient
                    : category.darkGradient,
                }}
              >
                {/* Theme-aware overlay to soften gradients */}
                <div
                  className={`absolute inset-0 transition-all duration-300 ${
                    isLightTheme
                      ? "bg-white/50 group-hover:bg-white/60"
                      : "bg-gray-700/40 opacity-100"
                  }`}
                />

                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Distinct border treatment */}
                <div
                  className={`absolute inset-0 transition-all duration-300 pointer-events-none ${
                    isLightTheme
                      ? "border-[3px] border-white/80"
                      : "border-2 border-white/10"
                  }`}
                />

                {/* Content */}
                <div className="p-4 sm:p-10 flex items-center justify-center h-full relative z-10">
                  <div className="text-center">
                    <h3
                      className={`text-xl md:text-2xl font-light transition-all duration-300 group-hover:scale-105 tracking-tight ${
                        isLightTheme
                          ? "text-gray-900 group-hover:text-gray-900"
                          : "text-white group-hover:text-white"
                      }`}
                    >
                      {category.title}
                    </h3>
                    {/* Arrow indicator on hover - hidden on mobile */}
                    <div className="hidden sm:flex mt-3 items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <span
                        className={`text-sm ${
                          isLightTheme ? "text-gray-900/70" : "text-white/80"
                        }`}
                      >
                        Explore
                      </span>
                      <span
                        className={`ml-2 transform group-hover:translate-x-1 transition-transform duration-300 ${
                          isLightTheme ? "text-gray-900/80" : "text-white/80"
                        }`}
                      >
                        →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
