"use client";

import {
  AnimatedSection,
} from "@/components/AnimatedSection";
import { BackButton } from "@/components/BackButton";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Github, Linkedin, Mail, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutPage() {
  const versions = [
    {
      version: "1.0.0",
      date: "May 28, 2026",
      status: "Current",
      features: [
        "Interactive Personalized Knowledge Testing Quizzes with proper Insights",
        "AI-Powered Daily Planner with Dynamic Goal Sequencing",
        "Achievement Badge System & Milestone Showcasing",
        "Academic Manager with Integrated Attendance Tracking",
      ],
    },
    {
      version: "Beta 1",
      date: "December 15, 2025",
      status: "Completed",
      features: [
        "Cosmic 'Midnight Violet' Aesthetic & Ambient Animations",
        "Deep Insights Dashboard for habit & trend monitoring",
        "Enhanced Privacy Controls & Granular Workspace Settings",
        "Real-time Notifications & Global Leaderboard System",
        "Student Hub with Curated, Category-based Content",
        "Shop & Rewards Integration for milestone celebrations",
        "Advanced Goal Tracking & Interactive Checklists",
        "Google OAuth & Secure Authentication System",
      ],
    },
  ];

  const upcomingFeatures = [
    {
      title: "AI-Powered Success Insights",
      description:
        "Personalized strategy recommendations and productivity forecasting based on your unique goal patterns.",
      status: "In Development",
      eta: "Q4 2026",
    },
    {
      title: "Experience Customization Hub",
      description:
        "Full control over themes, component layouts, and custom prestige titles to showcase your standing.",
      status: "In Development",
      eta: "Q4 2026",
    },
    {
      title: "Global Community Ecosystem",
      description:
        "Competitive social leagues, friend networks, and worldwide productivity marathons.",
      status: "Planned",
      eta: "Q4 2026",
    },
    {
      title: "External Integration Suite",
      description:
        "Seamless synchronization with popular tools like Notion, Google Calendar, and Discord.",
      status: "Planned",
      eta: "Q4 2026",
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

  // Generate random stars for background atmosphere (client-side only to avoid hydration mismatch)
  const [stars, setStars] = useState<Array<{left: string, top: string, size: number, opacity: number, delay: number}>>([]);
  
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 50 : 120;
    const baseSize = isMobile ? 0.5 : 0.8;
    const sizeVariance = isMobile ? 1 : 1.5;

    setStars(Array.from({ length: starCount }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * sizeVariance + baseSize,
      opacity: Math.random() * 0.8 + 0.4,
      delay: Math.random() * 5,
    })));
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#111116] transition-colors duration-1000 relative overflow-hidden">
      {/* Background Atmosphere & Stars */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Floating Background Blobs */}
        <motion.div 
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-5%] right-[-5%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-purple-500/[0.05] dark:bg-indigo-500/[0.08] rounded-full blur-[80px] md:blur-[140px]" 
        />
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-0 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-rose-500/[0.05] dark:bg-blue-900/[0.1] rounded-full blur-[60px] md:blur-[120px]" 
        />

        {/* Stars */}
        <div className="absolute inset-0">
          {stars.map((star, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [star.opacity, 0.1, star.opacity],
                scale: [1, 0.8, 1],
              }}
              transition={{
                duration: 1.5 + Math.random() * 2,
                repeat: Infinity,
                delay: star.delay,
                ease: "easeInOut",
              }}
              className="absolute rounded-full bg-indigo-400 dark:bg-white/40"
              style={{
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-10 pb-24 sm:pt-16 sm:pb-32">
        
        {/* Header */}
        <AnimatedSection className="mb-12 sm:mb-16">
          <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-4">
            <BackButton onClick={() => window.history.back()} />
            <h1 className="text-2xl sm:text-5xl font-light text-black dark:text-white mb-0 tracking-tight">
              About Zero<span className="font-normal italic">Gravity</span>
            </h1>
          </div>
          <p className="text-[13px] sm:text-base text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed font-light pl-1">
            A minimalist productivity sanctuary designed to help you achieve goals with clarity and focus.
          </p>
        </AnimatedSection>

        {/* Developer Card */}
        <AnimatedSection className="mb-16 sm:mb-24">
          <h2 className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400 dark:text-gray-500 mb-4 sm:mb-8">
            Developer
          </h2>
          {developers.map((dev, index) => (
            <div key={index} className="bg-white/40 dark:bg-[#181820]/40 backdrop-blur-xl border border-gray-100 dark:border-white/10 rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col md:flex-row group transition-all duration-500 hover:border-gray-200 dark:hover:border-white/20 shadow-sm dark:shadow-none">
              <div className="p-6 sm:p-10 flex-1 order-2 md:order-1">
                <h3 className="text-lg sm:text-2xl font-medium text-black dark:text-white mb-1">{dev.name}</h3>
                <p className="text-[12px] sm:text-base text-gray-500 dark:text-gray-400 mb-4 font-light">{dev.role}</p>
                <p className="text-[12px] sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-6 sm:mb-8 font-light italic opacity-80">
                  {dev.bio}
                </p>
                
                <div className="flex gap-4 sm:gap-5">
                  <a href={dev.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    <Github className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                  <a href={dev.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                  <a href={`mailto:${dev.email}`} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                </div>
              </div>
              
              <div className="w-full md:w-64 h-56 sm:h-72 md:h-auto relative order-1 md:order-2">
                <Image
                  src="https://aman-raj.me/home/cover_me.JPG"
                  alt={dev.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>
          ))}
        </AnimatedSection>

        {/* Version History */}
        <AnimatedSection className="mb-16 sm:mb-24">
          <h2 className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400 dark:text-gray-500 mb-4 sm:mb-8">
            Version History
          </h2>
          <div className="space-y-8 sm:space-y-10">
            {versions.map((v) => (
              <div key={v.version} className="relative pl-6 sm:pl-10 border-l border-gray-100 dark:border-white/10">
                <div className="absolute left-[-4px] sm:left-[-5px] top-1 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-gray-200 dark:bg-white/30" />
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 mb-2 sm:mb-4">
                  <h3 className="text-[15px] sm:text-lg font-medium text-black dark:text-white">Version {v.version}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] sm:text-xs text-gray-400 font-light">{v.date}</span>
                    <span className="text-[8px] uppercase tracking-widest font-bold text-gray-400 px-1.5 py-0.5 bg-gray-50 dark:bg-white/10 rounded w-fit">
                      {v.status}
                    </span>
                  </div>
                </div>
                <ul className="space-y-1.5 sm:space-y-2">
                  {v.features.map((f, fi) => (
                    <li key={fi} className="text-[12px] sm:text-sm text-gray-500 dark:text-gray-400 font-light flex items-start gap-2 sm:gap-3">
                      <span className="text-gray-300 dark:text-white/10 mt-1.5 sm:mt-1">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* Upcoming Features */}
        <AnimatedSection className="mb-16 sm:mb-24">
          <h2 className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400 dark:text-gray-500 mb-4 sm:mb-8">
            Future Roadmap
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-100 dark:bg-white/10 border border-gray-100 dark:border-white/10">
            {upcomingFeatures.map((feature, index) => (
              <div key={index} className="bg-white dark:bg-[#111116] p-5 sm:p-8 hover:bg-gray-50/50 dark:hover:bg-[#181820]/40 transition-colors">
                <div className="flex items-start gap-3 mb-2">
                  <Zap className="w-3.5 h-3.5 text-gray-400 mt-1" />
                  <h3 className="text-sm sm:text-lg font-light text-black dark:text-white tracking-tight leading-tight">{feature.title}</h3>
                </div>
                <p className="text-[12px] sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-light mb-4">
                  {feature.description}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-[8px] uppercase tracking-widest font-bold text-gray-400">{feature.status}</span>
                  <div className="h-px flex-1 bg-gray-100 dark:bg-white/10" />
                  <span className="text-[8px] uppercase tracking-widest font-bold text-gray-400">{feature.eta}</span>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* Footer CTA */}
        <AnimatedSection className="pt-10 sm:pt-12 border-t border-gray-100 dark:border-white/10 text-center">
          <h2 className="text-base sm:text-2xl font-light text-black dark:text-white mb-4 sm:mb-6 tracking-tight italic opacity-90">
            Want to contribute?
          </h2>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 sm:px-10 py-2 sm:py-3 border border-black dark:border-white text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all duration-300 text-[11px] sm:text-sm font-medium tracking-wide rounded-full"
          >
            Get in Touch
          </Link>
        </AnimatedSection>

      </div>
    </div>
  );
}
