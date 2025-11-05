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

export default function BenefitsList({ benefits, categoryTitle }: BenefitsListProps) {
  return (
    <div className="flex flex-col gap-6">
      {benefits.map((benefit, index) => (
        <Link
          key={index}
          href={benefit.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full overflow-hidden border border-gray-200/30 dark:border-gray-800/30 hover:border-white/30 dark:hover:border-white/30 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.01] transition-all duration-300 group cursor-pointer relative min-h-[120px] sm:min-h-[250px] flex flex-row rounded-lg"
          style={{
            background: benefit.backgroundStyle,
          }}
        >
          {/* Subtle gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
          
          {/* Border glow effect on hover */}
          <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-white/20 transition-all duration-300 pointer-events-none" />

          {/* Left side - Content */}
          <div className="flex-1 p-4 sm:p-6 md:p-12 flex items-center relative z-10 min-w-0">
            <div className="relative z-10 w-full">
              <h3 className="text-lg sm:text-xl md:text-3xl font-light text-white mb-1 sm:mb-2 md:mb-3 transition-all duration-300 group-hover:text-white group-hover:scale-[1.02] leading-tight">
                {benefit.title}
              </h3>
              <p className="text-gray-300 text-[10px] sm:text-xs md:text-base lg:text-lg leading-tight sm:leading-relaxed transition-all duration-300 group-hover:text-gray-200">
                {benefit.description}
              </p>
            </div>
          </div>

          {/* Right side - Image */}
          <div className="w-24 sm:w-32 md:w-[250px] h-24 sm:h-32 md:h-[250px] flex-shrink-0 relative overflow-hidden flex items-center justify-center z-10">
            <img
              src={benefit.image}
              alt={benefit.title}
              className="w-full h-full object-contain p-2 sm:p-3 md:p-4"
            />
          </div>
        </Link>
      ))}
    </div>
  );
}

