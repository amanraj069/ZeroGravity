"use client";

import React, { useEffect, useState } from "react";
import { adminListPastQuizzes } from "@/services/quizzesService";
import { useAuth } from "@/contexts/AuthContext";
import { AdminQuizListItem } from "@/types/quiz";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";

export default function AdminQuizzesPage() {
  const { user, isLoading } = useAuth();
  const [items, setItems] = useState<AdminQuizListItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      const res = await adminListPastQuizzes({ search, page, limit });
      if (res?.success) {
        setItems(res.items || []);
        setTotal(res.total || 0);
      }
      setLoading(false);
    })();
  }, [isAdmin, search, page, limit]);

  if (isLoading)
    return (
      <ZeroGravityLoading
        title="Loading Admin Panel"
        subtitle="Preparing admin dashboard..."
        showNavigation={false}
      />
    );
  if (!isAdmin)
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-lg text-black dark:text-white">
            Admin access required.
          </p>
        </div>
      </div>
    );

  const maxPage = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <main className="py-10">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header with Search */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-light text-black dark:text-white mb-2">
                Past Quizzes
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View and manage all ended quizzes
              </p>
            </div>
            <input
              type="text"
              className="w-full sm:w-80 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 px-4 py-3 text-sm focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-gray-500 transition-all rounded-lg"
              placeholder="Search by title"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-black dark:border-t-white rounded-full animate-spin mb-3"></div>
                <p className="text-gray-600 dark:text-gray-400 font-light">
                  Loading quizzes...
                </p>
              </div>
            </div>
          )}

          {/* Quiz List */}
          {!loading && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 shadow-sm rounded-xl overflow-hidden">
              {items.length === 0 ? (
                <div className="min-h-[600px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 mx-auto flex items-center justify-center mb-6">
                      <svg
                        className="w-16 h-16 sm:w-24 sm:h-24 text-black dark:text-white opacity-20 dark:opacity-40"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-base font-medium">
                      No past quizzes found.
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                      Ended quizzes will appear here
                    </p>
                  </div>
                </div>
              ) : (
                items.map((q) => (
                  <a
                    key={q.quizId}
                    href={`/admin/quizzes/${q.quizId}`}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors">
                        {q.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Quiz ID: {q.quizId}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
                        <span className="block text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                          Ended
                        </span>
                        {q.endedAt
                          ? new Date(q.endedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "-"}
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </a>
                ))
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && items.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {items.length} of {total} quizzes
              </p>
              <div className="flex items-center gap-3">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
                  Page {page} of {maxPage}
                </span>
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg"
                  disabled={page >= maxPage}
                  onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
