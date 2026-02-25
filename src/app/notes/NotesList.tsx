"use client";

import { Note } from "@/services/notesService";
import { Plus, Search, Star, Trash2, RotateCcw, Trash } from "lucide-react";

interface NotesListProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelect: (id: string) => void;
  onCreateNote: () => void;
  onTrashNote: (id: string) => void;
  onRestoreNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onEmptyTrash: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isTrash: boolean;
  loading: boolean;
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
  // Strip HTML tags for preview
  return content
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

export default function NotesList({
  notes,
  activeNoteId,
  onSelect,
  onCreateNote,
  onTrashNote,
  onRestoreNote,
  onDeleteNote,
  onToggleFavorite,
  onEmptyTrash,
  searchQuery,
  onSearchChange,
  isTrash,
  loading,
}: NotesListProps) {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-800 space-y-2">
        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes..."
            className="w-full text-sm pl-8 pr-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
          />
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between">
          {!isTrash ? (
            <button
              onClick={onCreateNote}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Plus size={14} />
              New Note
            </button>
          ) : (
            <button
              onClick={onEmptyTrash}
              disabled={notes.length === 0}
              className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Trash size={14} />
              Empty Trash
            </button>
          )}
          <span className="text-[10px] text-gray-400">
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </span>
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-gray-600 dark:border-t-gray-300 rounded-full animate-spin" />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isTrash
                ? "Trash is empty"
                : searchQuery
                  ? "No notes found"
                  : "No notes yet"}
            </p>
            {!isTrash && !searchQuery && (
              <button
                onClick={onCreateNote}
                className="mt-3 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white underline"
              >
                Create your first note
              </button>
            )}
          </div>
        ) : (
          notes.map((note) => {
            const active = note._id === activeNoteId;
            const preview = getPreview(note.content);

            return (
              <div
                key={note._id}
                onClick={() => onSelect(note._id)}
                className={`group cursor-pointer px-3 py-3 border-b border-gray-100 dark:border-gray-800/50 transition-colors ${
                  active
                    ? "bg-gray-100 dark:bg-gray-800/80"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3
                        className={`text-sm font-medium truncate ${
                          active
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {note.title || "Untitled"}
                      </h3>
                      {note.favorite && (
                        <Star
                          size={12}
                          className="text-yellow-500 fill-yellow-500 flex-shrink-0"
                        />
                      )}
                    </div>
                    {preview && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 line-clamp-2">
                        {preview}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">
                        {formatDate(note.lastUpdatedDate)}
                      </span>
                      {note.category && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-sm">
                          {note.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0 pt-0.5">
                    {isTrash ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRestoreNote(note._id);
                          }}
                          title="Restore"
                          className="p-1 text-gray-400 hover:text-green-600 rounded"
                        >
                          <RotateCcw size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNote(note._id);
                          }}
                          title="Delete permanently"
                          className="p-1 text-gray-400 hover:text-red-500 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(note._id);
                          }}
                          title={
                            note.favorite
                              ? "Remove from favorites"
                              : "Add to favorites"
                          }
                          className="p-1 text-gray-400 hover:text-yellow-500 rounded"
                        >
                          <Star
                            size={13}
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
                          title="Move to trash"
                          className="p-1 text-gray-400 hover:text-red-500 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
