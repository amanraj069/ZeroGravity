"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-3xl bg-white dark:bg-gray-800 shadow-sm p-8 border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-semibold mb-4 text-black dark:text-white">Create Quiz</h1>
          <div className="space-y-4">
            <input
              className="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 text-base bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-gray-500"
              placeholder="Quiz title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full border border-gray-300 dark:border-gray-700 px-4 py-3 text-base min-h-[120px] bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-gray-500"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="mt-6 flex justify-end">
            <button
              className="px-5 py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={proceed}
              disabled={!title}
            >
              Continue
            </button>
          </div>
        </div>
      </main>
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
