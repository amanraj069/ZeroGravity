"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import LandingNavbar from "@/components/landing/LandingNavbar";
import SimpleFooter from "@/components/landing/SimpleFooter";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";

interface StartCreateQuizPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function StartCreateQuizContent({ searchParams }: StartCreateQuizPageProps) {
  const router = useRouter();
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  useEffect(() => {
    const loadSearchParams = async () => {
      const params = await searchParams;
      setTitle((params?.title as string) || "");
      setDescription((params?.desc as string) || "");
    };
    loadSearchParams();
  }, [searchParams]);

  const proceed = () => {
    const params = new URLSearchParams();
    if (title) params.set("title", title);
    if (description) params.set("desc", description);
    router.push(`/quizzes/create?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <LandingNavbar />
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-3xl bg-white shadow-sm p-8">
          <h1 className="text-2xl font-semibold mb-4">Create Quiz</h1>
          <div className="space-y-4">
            <input
              className="w-full border px-4 py-3 text-base"
              placeholder="Quiz title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full border px-4 py-3 text-base min-h-[120px]"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="mt-6 flex justify-end">
            <button
              className="px-5 py-3 bg-black text-white"
              onClick={proceed}
              disabled={!title}
            >
              Continue
            </button>
          </div>
        </div>
      </main>
      <SimpleFooter />
    </div>
  );
}

export default function StartCreateQuizPage({
  searchParams,
}: StartCreateQuizPageProps) {
  return (
    <Suspense
      fallback={
        <ZeroGravityLoading
          title="Loading Quiz Creator"
          subtitle="Preparing the quiz creation experience..."
        />
      }
    >
      <StartCreateQuizContent searchParams={searchParams} />
    </Suspense>
  );
}
