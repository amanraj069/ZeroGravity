"use client";

import React from "react";

export default function NotesSkeleton({ isDocumentView = false }: { isDocumentView?: boolean }) {
  return (
    <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden bg-white dark:bg-[#0a0a0a]">

      {/* ── Sidebar Skeleton ── */}
      <div className="hidden lg:flex lg:flex-col w-64 min-w-[256px] bg-gray-50 dark:bg-[#111111] border-r border-gray-200 dark:border-gray-800 flex-shrink-0 select-none">

            {/* Header: px-4 min-h-[42px] border-b */}
            <div className="px-4 min-h-[42px] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
              <div className="h-3.5 w-12 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-6 w-14 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>

            {/* Search: px-3 min-h-[38px] border-b */}
            <div className="px-3 min-h-[38px] border-b border-gray-200 dark:border-gray-800 flex items-center flex-shrink-0">
              <div className="w-full h-[28px] bg-gray-100 dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded animate-pulse" />
            </div>

            {/* Top section: ~60% — nav + categories */}
            <div style={{ flex: 6 }} className="flex flex-col min-h-0 overflow-hidden">

          {/* Nav items: py-1.5, 3 rows */}
          <nav className="py-1.5 flex-shrink-0">
            {[
              { w: "w-[68px]", active: true },
              { w: "w-14", active: false },
              { w: "w-9", active: false },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-4 py-1.5 border-l-2 ${
                  item.active
                    ? "bg-gray-200/80 dark:bg-gray-800 border-blue-500"
                    : "border-transparent"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <div className="w-[15px] h-[15px] bg-gray-200 dark:bg-gray-700 rounded-sm animate-pulse flex-shrink-0" />
                  <div className={`h-3.5 ${item.w} bg-gray-200 dark:bg-gray-700 rounded animate-pulse`} />
                </span>
                <div className="h-2.5 w-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </nav>

          {/* Categories: flex-1 overflow-y-auto border-t */}
          <div className="flex-1 overflow-y-auto border-t border-gray-200 dark:border-gray-800">

            {/* Categories header sticky */}
            <div className="sticky top-0 z-10 bg-gray-50 dark:bg-[#111111] w-full flex items-center justify-between px-4 py-2">
              <span className="flex items-center gap-2">
                <div className="w-[13px] h-[13px] bg-gray-300 dark:bg-gray-600 rounded-sm animate-pulse" />
                <div className="h-2.5 w-[72px] bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
              </span>
              <span className="flex items-center gap-1">
                <div className="w-[11px] h-[11px] bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                <div className="w-[13px] h-[13px] bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
              </span>
            </div>

            {/* Category rows */}
            {[
              { name: "w-[88px]", count: "w-3" },
              { name: "w-16", count: "w-4" },
              { name: "w-20", count: "w-2" },
            ].map((cat, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-1.5">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className="w-[11px] h-[11px] bg-gray-200 dark:bg-gray-800 rounded animate-pulse flex-shrink-0" />
                  <div className={`h-3.5 ${cat.name} bg-gray-200 dark:bg-gray-800 rounded animate-pulse`} />
                  <div className={`h-2.5 ${cat.count} bg-gray-200 dark:bg-gray-800 rounded animate-pulse ml-auto flex-shrink-0`} />
                </div>
              </div>
            ))}

            {/* Uncategorised row */}
            <div className="flex items-center justify-between px-4 py-1.5">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <div className="w-[11px] h-[11px] bg-gray-200 dark:bg-gray-800 rounded animate-pulse flex-shrink-0" />
                <div className="w-[13px] h-[13px] bg-gray-200 dark:bg-gray-800 rounded animate-pulse flex-shrink-0" />
                <div className="h-3.5 w-[88px] bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-2.5 w-3 bg-gray-200 dark:bg-gray-800 rounded animate-pulse ml-auto flex-shrink-0" />
              </div>
            </div>
          </div>
        </div>

            {/* Recent section: ~40% border-t */}
            <div style={{ flex: 4 }} className="flex flex-col min-h-0 border-t border-gray-200 dark:border-gray-800">
          {/* "Recent" header */}
          <div className="px-4 py-2 flex items-center gap-2 bg-gray-50 dark:bg-[#111111] flex-shrink-0">
            <div className="w-[13px] h-[13px] bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            <div className="h-2.5 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>

          {/* Recent rows — enough to fill flex-[4] at any viewport */}
          <div className="flex-1 overflow-y-auto">
            {[
              { title: "w-[100px]", date: "w-7" },
              { title: "w-[72px]",  date: "w-8" },
              { title: "w-[112px]", date: "w-6" },
              { title: "w-[84px]",  date: "w-9" },
            ].map((row, i) => (
              <div key={i} className="px-4 py-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                    <div className={`h-3 ${row.title} bg-gray-100 dark:bg-gray-800 rounded animate-pulse`} />
                    <div className={`h-2.5 ${row.date} bg-gray-100 dark:bg-gray-800 rounded animate-pulse flex-shrink-0`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer: px-4 h-[33px] border-t */}
        <div className="px-4 h-[33px] border-t border-gray-200 dark:border-gray-800 flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1">
            <div className="h-4 w-7 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-2.5 w-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#0a0a0a]">
        {!isDocumentView ? (
          <>
            {/* Header bar */}
            <div className="flex flex-row items-center justify-between px-4 sm:px-6 min-h-[80px] py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse block sm:hidden" />
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse hidden sm:block" />
                <div>
                  <div className="h-[18px] w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-[11px] w-44 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mt-1" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-[30px] w-[90px] bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse" />
                <div className="hidden sm:block h-[30px] w-[90px] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md animate-pulse" />
              </div>
            </div>

            {/* Note cards grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">

                {/* New Note dashed card */}
                <div className="flex flex-col items-center justify-center h-44 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800" />
                  <div className="h-[11px] w-14 bg-gray-100 dark:bg-gray-800 rounded mt-2.5" />
                </div>

                {/* Note card skeletons */}
                {[
                  { title: "w-[75%]", lines: ["w-full", "w-[88%]", "w-[60%]"], tag: false },
                  { title: "w-[55%]", lines: ["w-full", "w-[70%]", "w-[82%]"], tag: true  },
                  { title: "w-[85%]", lines: ["w-[90%]", "w-[65%]", "w-[78%]"], tag: false },
                  { title: "w-[65%]", lines: ["w-full", "w-[80%]", "w-[50%]"], tag: true  },
                ].map((card, i) => (
                  <div
                    key={i}
                    className="flex flex-col h-44 rounded-lg border border-gray-300 dark:border-gray-700/60 bg-white dark:bg-[#141414] overflow-hidden animate-pulse"
                  >
                    <div className="flex items-center gap-2 px-3.5 pt-3.5 pb-2 flex-shrink-0">
                      <div className="w-7 h-8 rounded-sm bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className={`h-[13px] ${card.title} bg-gray-200 dark:bg-gray-700 rounded`} />
                        <div className="h-[10px] w-10 bg-gray-100 dark:bg-gray-800 rounded mt-1" />
                      </div>
                    </div>
                    <div className="flex-1 px-3.5 space-y-1.5 overflow-hidden">
                      {card.lines.map((lw, li) => (
                        <div key={li} className={`h-[11px] ${lw} bg-gray-100 dark:bg-gray-800/60 rounded`} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between px-3.5 py-2 border-t border-gray-100 dark:border-gray-800/60 flex-shrink-0">
                      {card.tag
                        ? <div className="h-[15px] w-16 bg-gray-100 dark:bg-gray-800 rounded" />
                        : <div />
                      }
                      <div />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Editor Header */}
            <div className="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-40 sm:w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-4 hidden sm:flex">
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              </div>
            </div>

            {/* Editor Toolbar */}
            <div className="h-10 border-b border-gray-200 dark:border-gray-800 flex items-center gap-4 px-4 sm:px-6 flex-shrink-0 overflow-hidden">
              <div className="flex items-center gap-3 hidden sm:flex">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              </div>
              <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 hidden sm:block" />
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />)}
              </div>
              <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 hidden sm:block" />
              <div className="flex items-center gap-3 hidden sm:flex">
                {[1, 2, 3].map(i => <div key={i} className="w-4 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />)}
              </div>
              <div className="w-px h-4 bg-gray-200 dark:bg-gray-800 hidden sm:block" />
              <div className="h-4 w-12 bg-gray-200 dark:bg-gray-800 rounded animate-pulse hidden sm:block" />
            </div>

            {/* Editor Content */}
            <div className="flex-1 p-6 sm:p-10 overflow-y-auto">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="h-8 w-[40%] bg-gray-200 dark:bg-gray-800/80 rounded animate-pulse mb-8" />
                
                <div className="space-y-3">
                  <div className="h-3 w-full bg-gray-100 dark:bg-gray-800/60 rounded animate-pulse" />
                  <div className="h-3 w-[95%] bg-gray-100 dark:bg-gray-800/60 rounded animate-pulse" />
                  <div className="h-3 w-[85%] bg-gray-100 dark:bg-gray-800/60 rounded animate-pulse" />
                </div>

                <div className="my-8 h-48 w-full bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-gray-800 rounded-lg animate-pulse" />

                <div className="space-y-3">
                  <div className="h-3 w-[90%] bg-gray-100 dark:bg-gray-800/60 rounded animate-pulse" />
                  <div className="h-3 w-[98%] bg-gray-100 dark:bg-gray-800/60 rounded animate-pulse" />
                  <div className="h-3 w-[60%] bg-gray-100 dark:bg-gray-800/60 rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Status bar */}
            <div className="h-8 border-t border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between flex-shrink-0">
              <div className="h-2 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-2 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
