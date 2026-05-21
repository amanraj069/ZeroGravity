"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Rocket, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[90dvh] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative floating stars/particles */}
      <div className="absolute inset-0 pointer-events-none -z-10 opacity-30 dark:opacity-20">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 bg-black dark:bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, Math.random() * -100 - 50],
              x: [0, (Math.random() - 0.5) * 50],
              opacity: [0, 0.8, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10,
            }}
          />
        ))}
      </div>

      <div className="relative text-center max-w-lg mx-auto z-10">
        <motion.div
          initial={{ y: 0 }}
          animate={{ y: [-15, 15, -15] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="flex justify-center mb-6 sm:mb-8"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-gray-100 dark:border-gray-700 relative">
            <Rocket className="w-10 h-10 sm:w-12 sm:h-12 text-black dark:text-white transform -rotate-45" />

            {/* Little floating moon next to rocket */}
            <motion.div
              className="absolute -right-3 -top-3 sm:-right-3 sm:-top-3 w-6 h-6 sm:w-6 sm:h-6 rounded-full bg-gray-200 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 shadow-sm"
              animate={{
                y: [-5, 5, -5],
                x: [-2, 2, -2],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Moon craters */}
              <div className="absolute top-1 left-1.5 sm:left-1.5 w-1.5 h-1.5 sm:w-1.5 sm:h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
              <div className="absolute bottom-1.5 right-1 w-1 h-1 sm:w-1 sm:h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl sm:text-7xl font-light text-black dark:text-white mb-2 sm:mb-3 tracking-tighter"
        >
          404
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl sm:text-2xl font-light text-gray-800 dark:text-gray-200 mb-4 sm:mb-5 tracking-wide"
        >
          Lost in Zero Gravity
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-gray-500 dark:text-gray-400 mb-8 sm:mb-8 text-sm sm:text-base leading-relaxed max-w-xs sm:max-w-sm mx-auto font-light px-4 sm:px-0"
        >
          The page you&apos;re looking for has drifted into the void.
          Let&apos;s guide you back to familiar space.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 sm:px-6 sm:py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-300 font-medium text-sm sm:text-sm group shadow-sm hover:shadow-lg hover:-translate-y-1"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1.5 transition-transform duration-300" />
            Return to Earth
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
