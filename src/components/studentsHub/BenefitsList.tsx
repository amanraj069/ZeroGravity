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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {benefits.map((benefit, index) => (
        <Link
          key={index}
          href={benefit.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full overflow-hidden border-2 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-600 transition-all duration-300 group cursor-pointer relative min-h-[120px] sm:min-h-[140px] flex rounded-2xl hover:shadow-xl hover:scale-[1.01]"
        >
          {/* Subtle background from original style, very faint on hover */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-[0.05] dark:group-hover:opacity-[0.1] transition-opacity duration-500 pointer-events-none" 
            style={{ background: benefit.backgroundStyle }} 
          />

          {/* Content */}
          <div className="w-full p-5 sm:p-6 flex flex-col justify-center relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg sm:text-xl font-light text-black dark:text-white transition-all duration-300 group-hover:translate-x-1">
                {benefit.title}
              </h3>
              <span className="text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors duration-300 transform translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0">
                →
              </span>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed font-light">
              {benefit.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
