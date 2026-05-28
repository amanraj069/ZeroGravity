"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Goals from "@/components/goals/Goals";
import GoalsSkeleton from "@/components/goals/GoalsSkeleton";

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
        {/* Render a consistent skeleton to avoid SSR/hydration mismatches from URL params */}
        <GoalsSkeleton mode="daily" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <main className="flex-1">
        <Goals />
      </main>
    </div>
  );
}

export default function GoalsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
          <GoalsSkeleton mode="daily" />
        </div>
      }
    >
      <GoalsPageContent />
    </Suspense>
  );
}
