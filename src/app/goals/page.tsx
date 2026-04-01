"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Goals from "@/components/goals/Goals";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";

function GoalsContent() {
  return <Goals />;
}

function GoalsLoadingFallback() {
  return (
    <ZeroGravityLoading
      title="Loading Goals"
      subtitle="Preparing your cosmic journey..."
    />
  );
}

export default function GoalsPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  if (authLoading) {
    return (
      <ZeroGravityLoading
        title="Authenticating"
        subtitle="Verifying your cosmic credentials..."
        showNavigation={false}
      />
    );
  }

  if (!isLoggedIn) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col pb-12 sm:pb-16">
      <main className="flex-1">
        <Suspense fallback={<GoalsLoadingFallback />}>
          <GoalsContent />
        </Suspense>
      </main>
    </div>
  );
}
