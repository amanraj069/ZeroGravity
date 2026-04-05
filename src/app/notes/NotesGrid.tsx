"use client";

import { useState, useMemo } from "react";
import { Note } from "@/services/notesService";
import { SidebarView } from "./NotesApp";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Star,
  Plus,
  Trash2,
  RotateCcw,
  Trash,
  PanelLeft,
  ArrowUpDown,
  ChevronDown,
} from "lucide-react";

type SortOption = "recent" | "title" | "oldest";

interface NotesGridProps {
  allNotes: Note[];
  view: SidebarView;
  activeCategory: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onTrashNote: (id: string) => void;
  onRestoreNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onEmptyTrash: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  searchQuery: string;
}

function formatDate(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getPreview(content: string) {
  return content
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export default function NotesGrid({
  allNotes,
  view,
  activeCategory,
  onSelectNote,
  onCreateNote,
  onTrashNote,
  onRestoreNote,
  onDeleteNote,
  onToggleFavorite,
  onEmptyTrash,
  sidebarOpen,
  onToggleSidebar,
  searchQuery,
}: NotesGridProps) {
  const router = useRouter();
  const isTrash = view === "trash";
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const viewTitle =
    view === "trash"
      ? "Trash"
      : view === "favorites"
        ? "Favorites"
        : activeCategory && activeCategory !== "__uncategorised"
          ? activeCategory
          : activeCategory === "__uncategorised"
            ? "Uncategorised"
            : "All Notes";

  const sortLabel = sortBy === "recent" ? "Recent" : sortBy === "title" ? "Title A-Z" : "Oldest";

  // Filter notes based on current view
  const filteredNotes = useMemo(() => {
    let notes: Note[];
    if (view === "trash") {
      notes = allNotes.filter((n) => n.trash);
    } else if (view === "favorites") {
      notes = allNotes.filter((n) => !n.trash && n.favorite);
    } else {
      notes = allNotes.filter((n) => !n.trash);
    }

    // Further filter by category if active
    if (
      activeCategory &&
      activeCategory !== "__uncategorised" &&
      view === "notes"
    ) {
      notes = notes.filter((n) => n.category === activeCategory);
    } else if (activeCategory === "__uncategorised" && view === "notes") {
      notes = notes.filter((n) => !n.category);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      notes = notes.filter(
        (n) =>
          (n.title || "").toLowerCase().includes(q) ||
          (n.content || "").replace(/<[^>]*>/g, " ").toLowerCase().includes(q)
      );
    }

    // Apply sorting
    return [...notes].sort((a, b) => {
      if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
      if (sortBy === "oldest") return new Date(a.lastUpdatedDate).getTime() - new Date(b.lastUpdatedDate).getTime();
      return new Date(b.lastUpdatedDate).getTime() - new Date(a.lastUpdatedDate).getTime();
    });
  }, [allNotes, view, activeCategory, sortBy, searchQuery]);

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-white dark:bg-[#0a0a0a]">
      {/* Header bar */}
      <div className="flex flex-row items-center justify-between px-4 sm:px-6 min-h-[80px] py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 flex-wrap gap-4">
        <div className="flex flex-row items-center justify-between w-full">
          {/* Leftside: Title & Context */}
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={onToggleSidebar}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded transition-colors block sm:hidden"
                title="Show sidebar"
              >
                <PanelLeft size={16} />
              </button>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors shrink-0 max-sm:hidden"
                title="Go back"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewTitle}
                </h1>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {filteredNotes.length}{" "}
                  {filteredNotes.length === 1 ? "note" : "notes"}
                  {!isTrash && ` · sorted by ${sortLabel.toLowerCase()}`}
                </p>
              </div>
            </div>
          </div>
          
          {/* Rightside: Action Buttons */}
          <div className="flex flex-row items-center gap-2 mt-0 ml-auto">
            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu((s) => !s)}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2.5 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Sort by"
              >
                <ArrowUpDown size={13} />
                {sortLabel}
                <ChevronDown size={11} />
              </button>
              {showSortMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSortMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-20 min-w-[130px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg py-1 rounded-md">
                    {(["recent", "title", "oldest"] as SortOption[]).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setSortBy(opt);
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          sortBy === opt
                            ? "text-gray-900 dark:text-white font-medium"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {opt === "recent" ? "Recent" : opt === "title" ? "Title A-Z" : "Oldest first"}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {isTrash && filteredNotes.length > 0 && (
              <button
                onClick={onEmptyTrash}
                className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 px-3 py-1.5 rounded-md border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              >
                <Trash size={13} />
                Empty Trash
              </button>
            )}
            {!isTrash && (
              <button
                onClick={onCreateNote}
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Plus size={13} />
                New Note
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className={`flex-1 overflow-y-auto p-4 sm:p-6 ${filteredNotes.length === 0 ? 'flex items-center justify-center' : ''}`}>
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 select-none py-20">
            <FileText size={48} strokeWidth={1} className="opacity-40" />
            <p className="mt-4 text-sm">
              {isTrash
                ? "Trash is empty"
                : view === "favorites"
                  ? "No favorite notes yet"
                  : "No notes yet"}
            </p>
            {!isTrash && view !== "favorites" && (
              <button
                onClick={onCreateNote}
                className="mt-3 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white underline transition-colors"
              >
                Create your first note
              </button>
            )}
            {view === "favorites" && (
              <p className="mt-3 text-xs text-gray-500">
                Click the <Star size={11} className="inline -mt-0.5" /> star on any note to add it to your favorites
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {/* New note card (not in trash) */}
            {!isTrash && (
              <button
                onClick={onCreateNote}
                className="group flex flex-col items-center justify-center h-44 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all hover:bg-gray-50 dark:hover:bg-gray-800/30"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                  <Plus
                    size={20}
                    className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                  />
                </div>
                <span className="text-xs text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 mt-2.5 font-medium transition-colors">
                  New Note
                </span>
              </button>
            )}

            {/* Note cards */}
            {filteredNotes.map((note) => {
              const preview = getPreview(note.content);
              return (
                <div
                  key={note._id}
                  onClick={() => onSelectNote(note._id)}
                  className="group relative flex flex-col h-44 rounded-lg border border-gray-300 dark:border-gray-700/60 bg-white dark:bg-[#141414] shadow-sm dark:shadow-none hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-md hover:shadow-gray-200/80 dark:hover:shadow-black/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden border-t-2 border-t-transparent hover:border-t-blue-400/60"
                >
                  {/* Document icon header */}
                  <div className="flex items-center gap-2 px-3.5 pt-3.5 pb-2 flex-shrink-0">
                    <div className="w-7 h-8 rounded-sm bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <FileText
                        size={14}
                        className="text-gray-400 dark:text-gray-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-medium text-gray-900 dark:text-white truncate leading-tight">
                        {note.title || "Untitled"}
                      </h3>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 tabular-nums">
                        {formatDate(note.lastUpdatedDate)}
                      </p>
                    </div>
                  </div>

                  {/* Preview text */}
                  <div className="flex-1 px-3.5 overflow-hidden">
                    <p className="text-[11px] leading-relaxed text-gray-500 dark:text-gray-500 line-clamp-4">
                      {preview || "Empty note"}
                    </p>
                  </div>

                  {/* Bottom bar: category + fav + trash actions */}
                  <div className="flex items-center justify-between px-3.5 py-2 border-t border-gray-100 dark:border-gray-800/60 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      {note.category && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded font-medium">
                          {note.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      {isTrash ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRestoreNote(note._id);
                            }}
                            className="p-1 text-gray-400 hover:text-green-600 rounded transition-colors"
                            title="Restore"
                          >
                            <RotateCcw size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteNote(note._id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                            title="Delete permanently"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          {note.favorite && (
                            <Star
                              size={11}
                              className="text-yellow-500 fill-yellow-500 flex-shrink-0"
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Hover actions (non-trash only) */}
                  {!isTrash && (
                    <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm px-0.5 py-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(note._id);
                        }}
                        className="p-1 text-gray-400 hover:text-yellow-500 rounded transition-colors"
                        title={
                          note.favorite
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                      >
                        <Star
                          size={12}
                          className={
                            note.favorite
                              ? "fill-yellow-500 text-yellow-500"
                              : ""
                          }
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTrashNote(note._id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                        title="Move to trash"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
