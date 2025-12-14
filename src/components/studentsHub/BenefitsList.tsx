"use client";

import Link from "next/link";

export interface Benefit {
  title: string;
  description: string;
  image: string;
  url: string;
  backgroundStyle: string;
}

interface BenefitsListProps {
  benefits: Benefit[];
  categoryTitle: string;
}

export default function BenefitsList({ benefits }: BenefitsListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {benefits.map((benefit, index) => (
        <Link
          key={index}
          href={benefit.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full overflow-hidden border border-gray-200/30 dark:border-gray-800/30 hover:border-white/30 dark:hover:border-white/30 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.01] transition-all duration-300 group cursor-pointer relative min-h-[120px] sm:min-h-[150px] md:min-h-[180px] flex"
          style={{
            background: benefit.backgroundStyle,
          }}
        >
          {/* Subtle gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Border glow effect on hover */}
          <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/20 transition-all duration-300 pointer-events-none" />

          {/* Content - Full Width */}
          <div className="w-full p-4 sm:p-6 md:p-6 lg:p-8 flex items-center relative z-10">
            <div className="relative z-10 w-full">
              <h3 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-light text-white mb-2 md:mb-3 transition-all duration-300 group-hover:text-white group-hover:scale-[1.02] leading-tight">
                {benefit.title}
              </h3>
              <p className="text-gray-300 text-xs sm:text-sm md:text-sm lg:text-base leading-relaxed transition-all duration-300 group-hover:text-gray-200">
                {benefit.description}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
