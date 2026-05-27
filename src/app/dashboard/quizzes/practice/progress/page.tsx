"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { getPracticeAnalytics, getCategoryInsights } from "@/services/practiceQuizService";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import { RefreshCw, Sparkles } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { motion } from "framer-motion";

const getScoreColor = (score: number) => {
  if (score < 40) return { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-500' };
  if (score < 50) return { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500' };
  if (score < 60) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500' };
  if (score < 70) return { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500' };
  if (score < 80) return { text: 'text-lime-600 dark:text-lime-400', bg: 'bg-lime-500' };
  if (score < 90) return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500' };
  return { text: 'text-green-600 dark:text-green-500', bg: 'bg-green-600 dark:bg-green-500' };
};

export default function PracticeProgressPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Define interfaces for analytics data
  interface AnalyticsAttempt {
    attemptId: string;
    quizId: string;
    quizName: string;
    topic: string;
    category: string;
    score: number;
    totalQuestions: number;
    accuracy: number;
    completedAt: string;
  }

  interface CategoryStat {
    category: string;
    averageAccuracy: number;
    totalAttempts: number;
  }

  interface TopicScore {
    topic: string;
    score: number;
  }

  interface InsightData {
    generalInsight: string;
    topicsToImprove: string[];
    topicScores: TopicScore[];
  }

  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<{
    attempts: AnalyticsAttempt[];
    categoryStats: CategoryStat[];
  }>({ attempts: [], categoryStats: [] });
  
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("General");
  const [selectedTopic, setSelectedTopic] = useState<string>("All");
  const [insightData, setInsightData] = useState<InsightData | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const insightCacheRef = useRef<Record<string, InsightData>>({});

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const response = await getPracticeAnalytics();
        if (response.success) {
          setAnalyticsData(response.data);
          const uniqueCategories = Array.from(new Set(response.data.attempts.map((a: { category: string }) => a.category)));
          const updatedCategories = uniqueCategories as string[];
          setCategories(updatedCategories);

          let defaultCategory = selectedCategory;
          if (typeof window !== 'undefined') {
            const urlCategory = new URLSearchParams(window.location.search).get('category');
            if (urlCategory && updatedCategories.includes(urlCategory)) {
              defaultCategory = urlCategory;
            }
          }
          
          // If defaultCategory is not in categories and current selection isn't valid, pick first available
          if (!updatedCategories.includes(defaultCategory) && uniqueCategories.length > 0) {
            setSelectedCategory(uniqueCategories[0] as string);
          } else {
            setSelectedCategory(defaultCategory);
          }
        } else {
          showToast("Failed to fetch analytics", "error");
        }
      } catch (error) {
        console.error(error);
        showToast("Error loading analytics", "error");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn) {
      fetchAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, authLoading, router, showToast]);

  useEffect(() => {
    const fetchInsight = async () => {
      if (selectedCategory === "All") {
        setInsightData(null);
        return;
      }
      
      if (insightCacheRef.current[selectedCategory]) {
        setInsightData(insightCacheRef.current[selectedCategory]);
        return;
      }
      
      setInsightLoading(true);
      try {
        const res = await getCategoryInsights(selectedCategory);
        if (res.success) {
          setInsightData(res.data);
          insightCacheRef.current[selectedCategory] = res.data;
        } else {
          setInsightData(null);
        }
      } catch (err) {
        console.error(err);
        setInsightData(null);
      } finally {
        setInsightLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchInsight();
    }
  }, [selectedCategory, isLoggedIn]);

  const handleRefreshInsight = async () => {
    if (selectedCategory === "All") return;
    
    setInsightLoading(true);
    try {
      const res = await getCategoryInsights(selectedCategory, true); // forceRefresh = true
      if (res.success) {
        setInsightData(res.data);
        insightCacheRef.current[selectedCategory] = res.data;
        showToast("Insights refreshed successfully!", "success");
      } else {
        showToast("Failed to refresh insights", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error refreshing insights", "error");
    } finally {
      setInsightLoading(false);
    }
  };

  if (loading || authLoading) {
    return <ZeroGravityLoading title="Loading Analytics" subtitle="Fetching your progress..." showNavigation={false} />;
  }

  const { attempts, categoryStats } = analyticsData;
  const filteredAttempts = selectedCategory === "All" 
    ? attempts 
    : attempts.filter(a => a.category === selectedCategory);

  // Get unique quizzes for the selected category (use name with topic fallback)
  const availableQuizzes = Array.from(
    new Map(filteredAttempts.map(a => [a.topic, a.quizName || a.topic])).entries()
  ); // [[topic, displayName], ...]

  // Filter by quiz (topic) if one is selected
  const topicFilteredAttempts = selectedTopic === "All"
    ? filteredAttempts
    : filteredAttempts.filter(a => a.topic === selectedTopic);

  // Sort by completedAt ascending (oldest first = Trial 1)
  const sortedAttempts = [...topicFilteredAttempts].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  const chartData = sortedAttempts.map((attempt, index) => ({
    name: `Trial ${index + 1}`,
    date: new Date(attempt.completedAt).toLocaleDateString(),
    accuracy: Math.round(attempt.accuracy),
    score: attempt.score,
    missed: attempt.totalQuestions - attempt.score,
    totalQuestions: attempt.totalQuestions,
    topic: attempt.topic
  }));

  const CHART_COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4"];

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-black dark:text-white">
      <main className="py-6 sm:py-10 px-4 max-w-6xl mx-auto w-full">
        <div className="mb-6 sm:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-4xl font-light text-black dark:text-white mb-0.5 sm:mb-1">
                Practice Progress
              </h1>
            </div>
          </div>
          
          {categories.length > 0 && (
            <div className="flex bg-gray-100/80 dark:bg-[#121216]/80 backdrop-blur-xl p-1.5 rounded-2xl border border-gray-200/50 dark:border-white/5 w-full md:w-auto shrink-0 overflow-x-auto custom-scrollbar relative z-0">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setSelectedTopic("All"); }}
                    className={`flex-1 relative px-5 py-2 sm:px-6 sm:py-2 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap transition-colors z-10 ${
                      isActive 
                        ? "text-black dark:text-white" 
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-category-tab"
                        className="absolute inset-0 bg-white dark:bg-[#202028] shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-gray-200/50 dark:border-white/10 rounded-xl"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        style={{ zIndex: -1 }}
                      />
                    )}
                    {cat}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {attempts.length === 0 ? (
          <div className="bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/5 rounded-2xl p-10 text-center flex flex-col items-center">
            <h2 className="text-xl font-medium mb-2">No data yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              You haven&apos;t completed any practice quizzes yet. Take a few quizzes to see your progress here!
            </p>
            <button
              onClick={() => router.push("/dashboard/quizzes?type=practice")}
              className="bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Take a Practice Quiz
            </button>
          </div>
        ) : (
          <>

            {/* AI Insights Section */}
            {selectedCategory !== "All" && (
              <div className="bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/5 rounded-2xl p-8 sm:p-10 lg:p-12 mb-8 relative overflow-hidden">
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-medium text-black dark:text-white">
                      AI Category Insights: {selectedCategory}
                    </h3>
                  </div>
                  <button 
                    onClick={handleRefreshInsight}
                    disabled={insightLoading}
                    className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors disabled:opacity-50"
                    title="Refresh Insights"
                  >
                    <RefreshCw size={18} className={insightLoading ? "animate-spin" : ""} />
                  </button>
                </div>

                {insightLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 text-sm animate-pulse">Analyzing your performance in {selectedCategory}...</p>
                  </div>
                ) : insightData ? (
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-base font-semibold mb-3">
                        Performance Summary
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 sm:mb-8">
                        {insightData.generalInsight}
                      </p>
                      
                      <div className="relative group w-fit mt-1">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-60 blur group-hover:opacity-100 animate-pulse transition duration-500 rounded-lg"></div>
                        <button 
                          onClick={() => {
                            const weakTopics = insightData?.topicScores
                              ?.filter((t: { score: number, topic: string }) => t.score < 70)
                              .map((t: { topic: string }) => t.topic)
                              .join(", ");
                              
                            let promptText = "";
                            if (weakTopics) {
                               promptText = `I want to strengthen my understanding of ${weakTopics} from the ${selectedCategory} category.`;
                            } else {
                               const lowestTopics = insightData?.topicScores
                                 ?.sort((a: {score: number}, b: {score: number}) => a.score - b.score)
                                 .slice(0, 2)
                                 .map((t: { topic: string }) => t.topic)
                                 .join(" and ");
                               promptText = `I want to achieve complete expert mastery in ${selectedCategory}. Give me advanced challenges, focusing especially on ${lowestTopics || 'core concepts'}.`;
                            }
                            
                            router.push(`/dashboard/goals?tab=daily&aiPlanner=true&style=practical&prompt=${encodeURIComponent(promptText)}`);
                          }}
                          className="relative text-sm font-medium bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors w-fit border border-gray-900 dark:border-gray-100"
                        >
                          <Sparkles className="w-4 h-4" />
                          Improve this category
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-semibold mb-4">
                        Topic Mastery
                      </h4>
                      <div className="space-y-4">
                        {insightData.topicScores && insightData.topicScores.map((ts, i) => {
                          const colors = getScoreColor(ts.score);
                          return (
                            <div key={i}>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium truncate pr-4 text-gray-700 dark:text-gray-200">
                                  {ts.topic}
                                </span>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">
                                  {ts.score}%
                                </span>
                              </div>
                              <div className="w-[85%] h-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-1000 ${colors.bg}`}
                                  style={{ width: `${Math.max(5, ts.score)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                        {(!insightData.topicScores || insightData.topicScores.length === 0) && (
                          <p className="text-sm text-gray-500">Not enough data to estimate specific topic scores.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    Failed to generate insights. Please try again later.
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
              {/* Bar Chart: Accuracy over questions */}
              <div className="lg:col-span-3 bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/5 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                  <h3 className="text-base font-medium">Accuracy over Questions</h3>
                  {availableQuizzes.length > 3 ? (
                    <select
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      className="bg-gray-100 dark:bg-[#1C1C22] text-xs font-medium text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 outline-none cursor-pointer focus:ring-2 focus:ring-gray-200 dark:focus:ring-white/10 max-w-[200px]"
                    >
                      <option value="All">All Quizzes</option>
                      {availableQuizzes.map(([topicKey, displayName]) => (
                        <option key={topicKey} value={topicKey}>
                          {displayName}
                        </option>
                      ))}
                    </select>
                  ) : availableQuizzes.length > 1 ? (
                    <div className="flex gap-1.5 bg-gray-100 dark:bg-[#1C1C22] p-1 rounded-lg overflow-x-auto custom-scrollbar">
                      <button
                        onClick={() => setSelectedTopic("All")}
                        className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                          selectedTopic === "All"
                            ? "bg-white dark:bg-[#2C2C35] text-black dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.04)]"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                      >
                        All Quizzes
                      </button>
                      {availableQuizzes.map(([topicKey, displayName]) => (
                        <button
                          key={topicKey}
                          onClick={() => setSelectedTopic(topicKey)}
                          className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                            selectedTopic === topicKey
                              ? "bg-white dark:bg-[#2C2C35] text-black dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.04)]"
                              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                          }`}
                        >
                          {displayName}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="h-[200px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} className="dark:stroke-white/10" />
                        <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          contentStyle={{ backgroundColor: 'var(--tw-colors-gray-900, #18181b)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          itemStyle={{ color: '#fff', fontWeight: 500 }}
                          labelStyle={{ color: '#a1a1aa', marginBottom: '8px', fontSize: '13px' }}
                        />
                        <Bar dataKey="score" stackId="a" fill="#3B82F6" name="Correct" barSize={32} animationDuration={300} />
                        <Bar dataKey="missed" stackId="a" fill="#EF4444" name="Incorrect" barSize={32} animationDuration={300} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      No attempts in this category yet.
                    </div>
                  )}
                </div>
              </div>
              {/* Category Stats Overview */}
              <div className="lg:col-span-2 bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/5 rounded-2xl p-5 flex flex-col">
                <h3 className="text-base font-medium mb-6">{selectedCategory} Stats</h3>
                <div className="flex-1 grid grid-rows-3 gap-4">
                  <div className="bg-gray-50 dark:bg-[#1C1C22] rounded-xl p-4 flex items-center justify-between border border-gray-100 dark:border-white/5 transition-all hover:bg-gray-100 dark:hover:bg-[#25252D]">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Category Attempts</p>
                    <p className="text-xl font-semibold text-black dark:text-white">
                      {filteredAttempts.length}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#1C1C22] rounded-xl p-4 flex items-center justify-between border border-gray-100 dark:border-white/5 transition-all hover:bg-gray-100 dark:hover:bg-[#25252D]">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Average Accuracy</p>
                    <p className="text-xl font-semibold text-black dark:text-white">
                      {Math.round(categoryStats.find((c: { category: string, averageAccuracy: number }) => c.category === selectedCategory)?.averageAccuracy || 0)}%
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-[#1C1C22] rounded-xl p-4 flex items-center justify-between border border-gray-100 dark:border-white/5 transition-all hover:bg-gray-100 dark:hover:bg-[#25252D]">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Topics Covered</p>
                    <p className="text-xl font-semibold text-black dark:text-white">
                      {new Set(filteredAttempts.map((a: { topic: string }) => a.topic)).size}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
              {/* Pie Chart: Attempts by Category */}
              <div className="lg:col-span-2 bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/5 rounded-2xl p-5">
                <h3 className="text-base font-medium mb-4">Attempts by Category</h3>
                <div className="h-[200px] w-full flex flex-col justify-center">
                  {categoryStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryStats}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="totalAttempts"
                          nameKey="category"
                          stroke="none"
                          animationDuration={500}
                        >
                          {categoryStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--tw-colors-gray-900, #18181b)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          itemStyle={{ color: '#fff', fontWeight: 500 }}
                          formatter={(value: number | string | readonly (string | number)[] | undefined) => [`${value || 0} Attempts`, 'Total']}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          iconType="circle"
                          wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      No category data available.
                    </div>
                  )}
                </div>
              </div>
              {/* Line Chart: Accuracy Over Trials */}
              <div className="lg:col-span-3 bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/5 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                  <h3 className="text-base font-medium">Accuracy Over Trials</h3>
                  {availableQuizzes.length > 3 ? (
                    <select
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      className="bg-gray-100 dark:bg-[#1C1C22] text-xs font-medium text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 outline-none cursor-pointer focus:ring-2 focus:ring-gray-200 dark:focus:ring-white/10 max-w-[200px]"
                    >
                      <option value="All">All Quizzes</option>
                      {availableQuizzes.map(([topicKey, displayName]) => (
                        <option key={topicKey} value={topicKey}>
                          {displayName}
                        </option>
                      ))}
                    </select>
                  ) : availableQuizzes.length > 1 ? (
                    <div className="flex gap-1.5 bg-gray-100 dark:bg-[#1C1C22] p-1 rounded-lg overflow-x-auto custom-scrollbar">
                      <button
                        onClick={() => setSelectedTopic("All")}
                        className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                          selectedTopic === "All"
                            ? "bg-white dark:bg-[#2C2C35] text-black dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.04)]"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                      >
                        All Quizzes
                      </button>
                      {availableQuizzes.map(([topicKey, displayName]) => (
                        <button
                          key={topicKey}
                          onClick={() => setSelectedTopic(topicKey)}
                          className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                            selectedTopic === topicKey
                              ? "bg-white dark:bg-[#2C2C35] text-black dark:text-white shadow-[0_2px_4px_rgba(0,0,0,0.04)]"
                              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                          }`}
                        >
                          {displayName}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                
                <div className="h-[200px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} className="dark:stroke-white/10" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#888" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                          tickMargin={12}
                          padding={{ left: 30, right: 30 }}
                        />
                        <YAxis 
                          stroke="#888" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false} 
                          domain={[0, 100]}
                          tickFormatter={(val) => `${val}%`}
                          tickMargin={12}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'var(--tw-colors-gray-900, #18181b)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                          itemStyle={{ color: '#fff', fontWeight: 500 }}
                          labelStyle={{ color: '#a1a1aa', marginBottom: '8px', fontSize: '13px' }}
                          formatter={(value: number | string | readonly (string | number)[] | undefined) => [`${value || 0}%`, 'Accuracy']}
                          labelFormatter={(label, payload) => {
                            if (payload && payload.length > 0) {
                              const data = payload[0].payload;
                              return `${data.date} • ${data.topic}`;
                            }
                            return label;
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="accuracy" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                          activeDot={{ r: 5, strokeWidth: 0, fill: "#3B82F6" }}
                          animationDuration={300}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      No attempts in this category yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </>
        )}
      </main>
    </div>
  );
}
