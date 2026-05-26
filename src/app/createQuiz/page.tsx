"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";

export default function StartCreateQuizPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect directly to quiz creation with Untitled as default title
    const params = new URLSearchParams();
    params.set("title", "Untitled");

    router.replace(`/dashboard/quizzes/create?${params.toString()}`);
  }, [router]);

  return (
    <ZeroGravityLoading
      title="Creating Quiz"
      subtitle="Setting up your new quiz..."
    />
  );
}
