"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Goals from "@/components/goals/Goals";
import GoalsSkeleton from "@/components/goals/GoalsSkeleton";

function GoalsLoadingFallback() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const mode = tab === "all" ? "goals" : "daily";
  
  return <GoalsSkeleton mode={mode} />;
}

function GoalsPageContent() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
        <GoalsLoadingFallback />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col pb-12 sm:pb-16">
      <main className="flex-1">
        <Goals />
      </main>
    </div>
  );
}

export default function GoalsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12"><GoalsSkeleton /></div>}>
      <GoalsPageContent />
    </Suspense>
  );
}
