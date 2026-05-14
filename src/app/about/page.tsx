"use client";

import {
  AnimatedSection,
} from "@/components/AnimatedSection";
import Link from "next/link";
import Image from "next/image";
import { Github, Linkedin, Mail, Zap } from "lucide-react";

export default function AboutPage() {
  const versions = [
    {
      version: "1.0.0",
      date: "April 25, 2026",
      status: "Current",
      features: [
        "Interactive Live Sessions & Knowledge Testing Quizzes",
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

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-1000">
      <div className="max-w-6xl mx-auto px-5 sm:px-12 pt-10 pb-24 sm:pt-16 sm:pb-32">
        
        {/* Header */}
        <AnimatedSection className="mb-12 sm:mb-16">
          <h1 className="text-2xl sm:text-5xl font-light text-black dark:text-white mb-2 sm:mb-4 tracking-tight">
            About Zero<span className="font-normal italic">Gravity</span>
          </h1>
          <p className="text-[13px] sm:text-base text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed font-light">
            A minimalist productivity sanctuary designed to help you achieve goals with clarity and focus.
          </p>
        </AnimatedSection>

        {/* Developer Card */}
        <AnimatedSection className="mb-16 sm:mb-24">
          <h2 className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] font-bold text-gray-400 dark:text-gray-500 mb-4 sm:mb-8">
            Developer
          </h2>
          {developers.map((dev, index) => (
            <div key={index} className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col md:flex-row group transition-all duration-500 hover:border-gray-200 dark:hover:border-white/10">
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
                  src="https://portfolio-aman-raj.vercel.app/home/cover_me.JPG"
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
              <div key={v.version} className="relative pl-6 sm:pl-10 border-l border-gray-100 dark:border-white/5">
                <div className="absolute left-[-4px] sm:left-[-5px] top-1 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-gray-200 dark:bg-white/20" />
                <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 mb-2 sm:mb-4">
                  <h3 className="text-[15px] sm:text-lg font-medium text-black dark:text-white">Version {v.version}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] sm:text-xs text-gray-400 font-light">{v.date}</span>
                    <span className="text-[8px] uppercase tracking-widest font-bold text-gray-400 px-1.5 py-0.5 bg-gray-50 dark:bg-white/5 rounded w-fit">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-gray-100 dark:bg-white/5 border border-gray-100 dark:border-white/5">
            {upcomingFeatures.map((feature, index) => (
              <div key={index} className="bg-white dark:bg-[#0a0a0a] p-5 sm:p-8 hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                <div className="flex items-start gap-3 mb-2">
                  <Zap className="w-3.5 h-3.5 text-gray-400 mt-1" />
                  <h3 className="text-sm sm:text-lg font-light text-black dark:text-white tracking-tight leading-tight">{feature.title}</h3>
                </div>
                <p className="text-[12px] sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-light mb-4">
                  {feature.description}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-[8px] uppercase tracking-widest font-bold text-gray-400">{feature.status}</span>
                  <div className="h-px flex-1 bg-gray-100 dark:bg-white/5" />
                  <span className="text-[8px] uppercase tracking-widest font-bold text-gray-400">{feature.eta}</span>
                </div>
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* Footer CTA */}
        <AnimatedSection className="pt-10 sm:pt-12 border-t border-gray-100 dark:border-white/5 text-center">
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
