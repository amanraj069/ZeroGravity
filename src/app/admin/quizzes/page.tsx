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

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const res = await adminListPastQuizzes({ search, page, limit });
      if (res?.success) {
        setItems(res.items || []);
        setTotal(res.total || 0);
      }
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
    <>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Past Quizzes</h1>
      <div className="flex gap-3 items-center">
        <input
          className="border  px-3 py-2 w-72"
          placeholder="Search by title"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>
      <div className="border  divide-y">
        {items.map((q) => (
          <a
            key={q.quizId}
            href={`/admin/quizzes/${q.quizId}`}
            className="p-3 flex items-center justify-between hover:bg-gray-50"
          >
            <div>
              <div className="font-medium">{q.title}</div>
              <div className="text-sm text-gray-600">Quiz ID: {q.quizId}</div>
            </div>
            <div className="text-sm text-gray-600">
              Ended: {q.endedAt ? new Date(q.endedAt).toLocaleString() : "-"}
            </div>
          </a>
        ))}
        {items.length === 0 ? (
          <div className="p-3 text-sm text-gray-600">
            No past quizzes found.
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <button
          className="px-3 py-1 border "
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <div className="text-sm">
          Page {page} / {maxPage}
        </div>
        <button
          className="px-3 py-1 border "
          disabled={page >= maxPage}
          onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
        >
          Next
        </button>
      </div>
      </div>
    </>
  );
}
