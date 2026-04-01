"use client";

import { useState, useMemo } from "react";
import { Note, NoteCategory } from "@/services/notesService";
import { SidebarView } from "./NotesApp";
import {
  FileText,
  Star,
  Trash2,
  FolderOpen,
  Plus,
  ChevronDown,
  ChevronRight,
  Pencil,
  X,
  Check,
  Search,
  Clock,
  Inbox,
  RotateCcw,
  Pin,
} from "lucide-react";

interface NotesSidebarProps {
  view: SidebarView;
  onChangeView: (view: SidebarView) => void;
  categories: NoteCategory[];
  activeCategory: string | null;
  onSelectCategory: (name: string | null) => void;
  onCreateCategory: (name: string) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onTogglePinCategory: (id: string) => void;
  allNotes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onTrashNote: (id: string) => void;
  onRestoreNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onCreateNoteInCategory: (categoryName: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCloseSidebar: () => void;
}

function formatTimeAgo(date: string) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotesSidebar({
  view,
  onChangeView,
  categories,
  activeCategory,
  onSelectCategory,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onTogglePinCategory,
  allNotes,
  activeNoteId,
  onSelectNote,
  onCreateNote,
  onTrashNote,
  onRestoreNote,
  onDeleteNote,
  onCreateNoteInCategory,
  searchQuery,
  onSearchChange,
  onCloseSidebar,
}: NotesSidebarProps) {
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editCategoryName, setEditCategoryName] = useState("");

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onCreateCategory(newCategoryName.trim());
      setNewCategoryName("");
      setAddingCategory(false);
    }
  };

  const handleSaveEditCategory = (id: string) => {
    if (editCategoryName.trim()) {
      onUpdateCategory(id, editCategoryName.trim());
      setEditingCategoryId(null);
      setEditCategoryName("");
    }
  };

  const toggleCatExpand = (catName: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(catName)) next.delete(catName);
      else next.add(catName);
      return next;
    });
  };

  // ─── Derived data ────────────────────────────────────────
  const searchFiltered = useMemo(() => {
    if (!searchQuery) return allNotes;
    const q = searchQuery.toLowerCase();
    return allNotes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content
          .replace(/<[^>]*>/g, " ")
          .toLowerCase()
          .includes(q),
    );
  }, [allNotes, searchQuery]);

  // Categories always show non-trash notes, independent of the nav view
  const categoryNotes = useMemo(() => {
    return searchFiltered.filter((n) => !n.trash);
  }, [searchFiltered]);

  const uncategorisedNotes = categoryNotes.filter((n) => !n.category);
  const getNotesForCategory = (name: string) =>
    categoryNotes.filter((n) => n.category === name);

  const allCount = allNotes.filter((n) => !n.trash).length;
  const favCount = allNotes.filter((n) => !n.trash && n.favorite).length;
  const trashCount = allNotes.filter((n) => n.trash).length;

  const recentNotes = useMemo(() => {
    return [...searchFiltered]
      .filter((n) => !n.trash)
      .sort(
        (a, b) =>
          new Date(b.lastUpdatedDate).getTime() -
          new Date(a.lastUpdatedDate).getTime(),
      )
      .slice(0, 8);
  }, [searchFiltered]);

  const navItems = [
    {
      id: "notes" as SidebarView,
      label: "All Notes",
      icon: FileText,
      count: allCount,
    },
    {
      id: "favorites" as SidebarView,
      label: "Favorites",
      icon: Star,
      count: favCount,
    },
    {
      id: "trash" as SidebarView,
      label: "Trash",
      icon: Trash2,
      count: trashCount,
    },
  ];

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="w-64 h-full bg-gray-50 dark:bg-[#111111] border-r border-gray-200 dark:border-gray-800 flex flex-col select-none">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="px-4 min-h-[42px] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wide uppercase">
          Notes
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={onCreateNote}
            className="flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800"
            title="New note (⌘N)"
          >
            <Plus size={13} />
            New
          </button>
          <button
            onClick={onCloseSidebar}
            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded transition-colors lg:hidden"
            title="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Search ───────────────────────────────────────── */}
      <div className="px-3 min-h-[38px] border-b border-gray-200 dark:border-gray-800 flex-shrink-0 flex items-center">
        <div className="relative w-full">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes..."
            className="w-full text-xs pl-7 pr-3 py-1.5 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-blue-400/20 transition-colors"
          />
        </div>
      </div>

      {/* ── Top section: Nav + Categories (~60%) ──────── */}
      <div className="flex-[6] flex flex-col min-h-0 overflow-hidden">
        {/* Navigation */}
        <nav className="py-1.5 flex-shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.id === "notes"
                ? view === "notes" && !activeCategory && !activeNoteId
                : view === item.id && !activeNoteId;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`w-full flex items-center justify-between px-4 py-1.5 text-[13px] transition-all ${
                  active
                    ? "bg-gray-200/80 dark:bg-gray-800 text-gray-900 dark:text-white font-medium border-l-2 border-blue-500"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white border-l-2 border-transparent"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={15} />
                  {item.label}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">
                  {item.count}
                </span>
              </button>
            );
          })}
        </nav>

        {/* ── Categories section (scrollable) ──────── */}
        <div className="flex-1 overflow-y-auto border-t border-gray-200 dark:border-gray-800">
          <div
            onClick={() => setCategoriesExpanded((e) => !e)}
            className="sticky top-0 z-10 bg-gray-50 dark:bg-[#111111] w-full flex items-center justify-between px-4 py-2 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FolderOpen size={13} />
              Categories
            </span>
            <span className="flex items-center gap-1">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setAddingCategory(true);
                  setCategoriesExpanded(true);
                }}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded cursor-pointer"
                title="Add category"
              >
                <Plus size={11} />
              </span>
              {categoriesExpanded ? (
                <ChevronDown size={13} />
              ) : (
                <ChevronRight size={13} />
              )}
            </span>
          </div>

          {categoriesExpanded && (
            <div className="pb-2">
              {/* Add category input */}
              {addingCategory && (
                <div className="flex items-center gap-1 px-4 py-1">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCategory();
                      if (e.key === "Escape") {
                        setAddingCategory(false);
                        setNewCategoryName("");
                      }
                    }}
                    autoFocus
                    placeholder="Category name"
                    className="flex-1 min-w-0 text-xs px-2 py-1 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="p-1 text-green-600 hover:text-green-700"
                  >
                    <Check size={13} />
                  </button>
                  <button
                    onClick={() => {
                      setAddingCategory(false);
                      setNewCategoryName("");
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* Category items */}
              {categories.map((cat) => {
                const isEditing = editingCategoryId === cat._id;
                const isExpanded = expandedCats.has(cat.name);
                const catNotes = getNotesForCategory(cat.name);

                if (isEditing) {
                  return (
                    <div
                      key={cat._id}
                      className="flex items-center gap-1 px-4 py-1"
                    >
                      <input
                        type="text"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleSaveEditCategory(cat._id);
                          if (e.key === "Escape") {
                            setEditingCategoryId(null);
                            setEditCategoryName("");
                          }
                        }}
                        autoFocus
                        className="flex-1 min-w-0 text-xs px-2 py-1 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => handleSaveEditCategory(cat._id)}
                        className="p-1 text-green-600 hover:text-green-700"
                      >
                        <Check size={13} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingCategoryId(null);
                          setEditCategoryName("");
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  );
                }

                return (
                  <div key={cat._id}>
                    <div
                      className={`group flex items-center justify-between px-4 py-1.5 cursor-pointer transition-colors ${
                        activeCategory === cat.name
                          ? "bg-gray-200/70 dark:bg-gray-800/80 text-gray-900 dark:text-white"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      <div
                        className="flex items-center gap-1.5 flex-1 min-w-0"
                        onClick={() => {
                          onSelectCategory(cat.name);
                          toggleCatExpand(cat.name);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronDown
                            size={11}
                            className="flex-shrink-0 opacity-60"
                          />
                        ) : (
                          <ChevronRight
                            size={11}
                            className="flex-shrink-0 opacity-60"
                          />
                        )}
                        {cat.pinned && (
                          <Pin
                            size={10}
                            className="flex-shrink-0 text-blue-500 fill-blue-500 -rotate-45"
                          />
                        )}
                        <span className="text-[13px] truncate">{cat.name}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto flex-shrink-0 tabular-nums">
                          {catNotes.length}
                        </span>
                      </div>
                      <span className="hidden group-hover:flex items-center gap-0.5 ml-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePinCategory(cat._id);
                          }}
                          className={`p-0.5 rounded ${
                            cat.pinned
                              ? "text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                              : "hover:bg-gray-300 dark:hover:bg-gray-700"
                          }`}
                          title={cat.pinned ? "Unpin category" : "Pin category"}
                        >
                          <Pin
                            size={11}
                            className={
                              cat.pinned
                                ? "fill-blue-500 -rotate-45"
                                : "-rotate-45"
                            }
                          />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategoryId(cat._id);
                            setEditCategoryName(cat.name);
                          }}
                          className="p-0.5 hover:bg-gray-300 dark:hover:bg-gray-700 rounded"
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCategory(cat._id);
                          }}
                          className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    </div>

                    {isExpanded && catNotes.length > 0 && (
                      <div className="ml-4 border-l border-gray-200 dark:border-gray-700/50">
                        {catNotes.map((n) => (
                          <NoteRow
                            key={n._id}
                            note={n}
                            isActive={activeNoteId === n._id}
                            onClick={() => onSelectNote(n._id)}
                            view={view}
                            onTrash={() => onTrashNote(n._id)}
                            onRestore={() => onRestoreNote(n._id)}
                            onDelete={() => onDeleteNote(n._id)}
                            compact
                          />
                        ))}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateNoteInCategory(cat.name);
                          }}
                          className="w-full text-left pl-4 pr-3 py-1.5 text-[11px] text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800/30 transition-colors flex items-center gap-1.5"
                        >
                          <Plus size={11} />
                          New note
                        </button>
                      </div>
                    )}
                    {isExpanded && catNotes.length === 0 && (
                      <div className="ml-4 border-l border-gray-200 dark:border-gray-700/50">
                        <p className="pl-4 py-1 text-[10px] text-gray-400 dark:text-gray-600 italic">
                          No notes
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateNoteInCategory(cat.name);
                          }}
                          className="w-full text-left pl-4 pr-3 py-1.5 text-[11px] text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800/30 transition-colors flex items-center gap-1.5"
                        >
                          <Plus size={11} />
                          New note
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ── Uncategorised section ──────────────── */}
              <div>
                <div
                  className={`group flex items-center justify-between px-4 py-1.5 cursor-pointer transition-colors ${
                    activeCategory === "__uncategorised"
                      ? "bg-gray-200/70 dark:bg-gray-800/80 text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/40 hover:text-gray-900 dark:hover:text-white"
                  }`}
                  onClick={() => {
                    onSelectCategory("__uncategorised");
                    setExpandedCats((prev) => {
                      const next = new Set(prev);
                      if (next.has("__uncategorised"))
                        next.delete("__uncategorised");
                      else next.add("__uncategorised");
                      return next;
                    });
                  }}
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {expandedCats.has("__uncategorised") ? (
                      <ChevronDown
                        size={11}
                        className="flex-shrink-0 opacity-60"
                      />
                    ) : (
                      <ChevronRight
                        size={11}
                        className="flex-shrink-0 opacity-60"
                      />
                    )}
                    <Inbox size={13} className="flex-shrink-0 opacity-60" />
                    <span className="text-[13px] truncate">Uncategorised</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto flex-shrink-0 tabular-nums">
                      {uncategorisedNotes.length}
                    </span>
                  </div>
                </div>

                {expandedCats.has("__uncategorised") &&
                  uncategorisedNotes.length > 0 && (
                    <div className="ml-4 border-l border-gray-200 dark:border-gray-700/50">
                      {uncategorisedNotes.map((n) => (
                        <NoteRow
                          key={n._id}
                          note={n}
                          isActive={activeNoteId === n._id}
                          onClick={() => onSelectNote(n._id)}
                          view={view}
                          onTrash={() => onTrashNote(n._id)}
                          onRestore={() => onRestoreNote(n._id)}
                          onDelete={() => onDeleteNote(n._id)}
                          compact
                        />
                      ))}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateNoteInCategory(null);
                        }}
                        className="w-full text-left pl-4 pr-3 py-1.5 text-[11px] text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800/30 transition-colors flex items-center gap-1.5"
                      >
                        <Plus size={11} />
                        New note
                      </button>
                    </div>
                  )}
                {expandedCats.has("__uncategorised") &&
                  uncategorisedNotes.length === 0 && (
                    <div className="ml-4 border-l border-gray-200 dark:border-gray-700/50">
                      <p className="pl-4 py-1 text-[10px] text-gray-400 dark:text-gray-600 italic">
                        No notes
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateNoteInCategory(null);
                        }}
                        className="w-full text-left pl-4 pr-3 py-1.5 text-[11px] text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800/30 transition-colors flex items-center gap-1.5"
                      >
                        <Plus size={11} />
                        New note
                      </button>
                    </div>
                  )}
              </div>

              {categories.length === 0 &&
                uncategorisedNotes.length === 0 &&
                !addingCategory && (
                  <p className="px-4 py-2 text-[11px] text-gray-400 dark:text-gray-600 italic pl-10">
                    No categories yet
                  </p>
                )}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom section: Recent (~40%) ────────────────── */}
      <div className="flex-[4] flex flex-col min-h-0 border-t border-gray-200 dark:border-gray-800">
        <div className="px-4 py-2 flex items-center gap-2 bg-gray-50 dark:bg-[#111111] flex-shrink-0">
          <Clock size={13} className="text-gray-400 dark:text-gray-500" />
          <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Recent
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {recentNotes.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-[11px] text-gray-400 dark:text-gray-600 italic">
                No recent notes
              </p>
            </div>
          ) : (
            recentNotes.map((n) => (
              <button
                key={n._id}
                onClick={() => {
                  if (view === "trash") onChangeView("notes");
                  onSelectNote(n._id);
                }}
                className={`w-full text-left px-4 py-1.5 transition-all group ${
                  activeNoteId === n._id
                    ? "bg-gray-200/60 dark:bg-gray-800/60"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[12px] truncate ${
                          activeNoteId === n._id
                            ? "text-gray-900 dark:text-white font-medium"
                            : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                        }`}
                      >
                        {n.title || "Untitled"}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-600 flex-shrink-0 tabular-nums">
                        {formatTimeAgo(n.lastUpdatedDate)}
                      </span>
                    </div>
                  </div>
                  {n.favorite && (
                    <Star
                      size={10}
                      className="text-yellow-500 fill-yellow-500 flex-shrink-0"
                    />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────── */}
      <div className="px-4 h-[33px] border-t border-gray-200 dark:border-gray-800 text-[10px] text-gray-400 dark:text-gray-600 hidden lg:flex items-center gap-3 flex-shrink-0">
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[9px] font-mono">
            ⌘N
          </kbd>{" "}
          New note
        </span>
      </div>
    </div>
  );
}

// ─── Note row sub-component ─────────────────────────────────
function NoteRow({
  note,
  isActive,
  onClick,
  view,
  onTrash,
  onRestore,
  onDelete,
  compact,
}: {
  note: Note;
  isActive: boolean;
  onClick: () => void;
  view: SidebarView;
  onTrash: () => void;
  onRestore: () => void;
  onDelete: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left transition-colors group ${
        compact ? "pl-4 pr-3 py-1.5" : "px-4 py-2"
      } ${
        isActive
          ? "bg-blue-50/80 dark:bg-blue-900/15 text-blue-700 dark:text-blue-400"
          : "text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/30"
      }`}
      title={note.title || "Untitled"}
    >
      <span className="flex items-center gap-1.5">
        <FileText
          size={compact ? 11 : 13}
          className="flex-shrink-0 opacity-50"
        />
        <span
          className={`${compact ? "text-[12px]" : "text-[13px]"} truncate flex-1`}
        >
          {note.title || "Untitled"}
        </span>
        {note.favorite && (
          <Star
            size={10}
            className="text-yellow-500 fill-yellow-500 flex-shrink-0"
          />
        )}
        <span className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
          {view === "trash" ? (
            <>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onRestore();
                }}
                className="p-0.5 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 rounded cursor-pointer"
                title="Restore"
              >
                <RotateCcw size={11} />
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded cursor-pointer"
                title="Delete permanently"
              >
                <Trash2 size={11} />
              </span>
            </>
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onTrash();
              }}
              className="p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 rounded cursor-pointer"
              title="Move to trash"
            >
              <Trash2 size={11} />
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
