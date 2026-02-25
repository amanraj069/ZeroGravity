"use client";

import { useMemo } from "react";
import { Note } from "@/services/notesService";
import { SidebarView } from "./NotesApp";
import {
  FileText,
  Star,
  Plus,
  Trash2,
  RotateCcw,
  Trash,
  PanelLeft,
} from "lucide-react";

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
}: NotesGridProps) {
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

    // Sort by recently updated
    return notes.sort(
      (a, b) =>
        new Date(b.lastUpdatedDate).getTime() -
        new Date(a.lastUpdatedDate).getTime(),
    );
  }, [allNotes, view, activeCategory]);

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

  const isTrash = view === "trash";

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded transition-colors"
              title="Show sidebar"
            >
              <PanelLeft size={16} />
            </button>
          )}
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {viewTitle}
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {filteredNotes.length}{" "}
              {filteredNotes.length === 1 ? "note" : "notes"}
              {!isTrash && " · sorted by recent"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
              className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Plus size={13} />
              New Note
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 select-none">
            <FileText size={48} strokeWidth={1} className="opacity-40" />
            <p className="mt-4 text-sm">
              {isTrash
                ? "Trash is empty"
                : view === "favorites"
                  ? "No favorite notes yet"
                  : "No notes yet"}
            </p>
            {!isTrash && (
              <button
                onClick={onCreateNote}
                className="mt-3 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white underline transition-colors"
              >
                Create your first note
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {/* New note card (not in trash) */}
            {!isTrash && (
              <button
                onClick={onCreateNote}
                className="group flex flex-col items-center justify-center h-48 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-all hover:bg-gray-50 dark:hover:bg-gray-800/30"
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
                  className="group relative flex flex-col h-48 rounded-lg border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-[#141414] hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md dark:hover:shadow-gray-900/40 transition-all cursor-pointer overflow-hidden"
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

                  {/* Bottom bar: category + fav */}
                  <div className="flex items-center justify-between px-3.5 py-2 border-t border-gray-100 dark:border-gray-800/60 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      {note.category && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded font-medium">
                          {note.category}
                        </span>
                      )}
                    </div>
                    {note.favorite && (
                      <Star
                        size={11}
                        className="text-yellow-500 fill-yellow-500 flex-shrink-0"
                      />
                    )}
                  </div>

                  {/* Hover actions */}
                  <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm px-0.5 py-0.5">
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
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
