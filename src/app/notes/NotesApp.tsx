"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Note,
  NoteCategory,
  fetchNotes,
  fetchCategories,
  createNote,
  updateNote as updateNoteApi,
  trashNote,
  restoreNote,
  deleteNote,
  emptyTrash as emptyTrashApi,
  toggleFavorite as toggleFavoriteApi,
  createCategory,
  updateCategory,
  deleteCategory,
  togglePinCategory as togglePinCategoryApi,
} from "@/services/notesService";
import NotesSidebar from "./NotesSidebar";
import NoteEditor from "./NoteEditor";
import NotesGrid from "./NotesGrid";
import NotesSkeleton from "./NotesSkeleton";

export type SidebarView = "notes" | "favorites" | "trash";

const TAB_MAP: Record<string, SidebarView> = {
  all: "notes",
  favorites: "favorites",
  trash: "trash",
};
const VIEW_TO_TAB: Record<SidebarView, string> = {
  notes: "all",
  favorites: "favorites",
  trash: "trash",
};

interface NotesAppProps {
  initialDocId?: string;
}

export default function NotesApp({ initialDocId }: NotesAppProps = {}) {
  const searchParams = useSearchParams();

  // ─── State ────────────────────────────────────────────────
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(
    initialDocId ?? null,
  );
  const [sidebarView, setSidebarView] = useState<SidebarView>(() => {
    const tab = searchParams.get("tab");
    return (tab && TAB_MAP[tab]) || "notes";
  });
  const [activeCategory, setActiveCategory] = useState<string | null>(() => {
    return searchParams.get("category") || null;
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth >= 1024;
    return true;
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Prevent URL updates during initial mount / data load
  const initializedRef = useRef(false);

  // Debounce timer
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Derived ──────────────────────────────────────────────
  const activeNote = allNotes.find((n) => n._id === activeNoteId) ?? null;

  // ─── Data loading ─────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch both non-trash and trash notes, plus categories
      const [nonTrashNotes, trashNotes, catsData] = await Promise.all([
        fetchNotes({}),
        fetchNotes({ trash: true }),
        fetchCategories(),
      ]);
      setAllNotes([...nonTrashNotes, ...trashNotes]);
      setCategories(catsData);
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData().then(() => {
      initializedRef.current = true;
    });
  }, [loadData]);

  // Ensure sidebar opens automatically when switching from mobile to desktop
  useEffect(() => {
    if (typeof window === "undefined") return;
    let prevWidth = window.innerWidth;
    const handleResize = () => {
      if (prevWidth < 1024 && window.innerWidth >= 1024) {
        setSidebarOpen(true);
      }
      prevWidth = window.innerWidth;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ─── URL sync ─────────────────────────────────────────────
  // Keep the browser URL in sync with the current view state.
  // When a note is active → /notes/{id}
  // When no note is active → /notes?tab=all|favorites|trash[&category=...]
  useEffect(() => {
    if (!initializedRef.current) return;

    if (activeNoteId) {
      if (window.location.pathname !== `/notes/${activeNoteId}`) {
        const url = `/notes/${activeNoteId}`;
        window.history.pushState(null, "", url);
      }
    } else {
      const params = new URLSearchParams();
      params.set("tab", VIEW_TO_TAB[sidebarView]);
      if (activeCategory) {
        params.set("category", activeCategory);
      }
      const newUrl = `/notes?${params.toString()}`;
      if (window.location.pathname + window.location.search !== newUrl) {
        window.history.pushState(null, "", newUrl);
      }
    }
  }, [activeNoteId, sidebarView, activeCategory]);

  // If user arrives with initialDocId, switch to correct sidebar view
  // after data loads (e.g. show trash tab if the note is trashed)
  useEffect(() => {
    if (!initialDocId || !initializedRef.current) return;
    const note = allNotes.find((n) => n._id === initialDocId);
    if (note?.trash) {
      setSidebarView("trash");
    } else if (note?.favorite && sidebarView === "favorites") {
      // keep favorites view
    }
    // If the note was permanently deleted / not found, go back to grid
    if (allNotes.length > 0 && !note) {
      setActiveNoteId(null);
    }
  }, [allNotes, initialDocId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Note actions ─────────────────────────────────────────
  const handleCreateNote = useCallback(async () => {
    try {
      const body: Partial<Note> = {
        title: "Untitled",
        content: "",
        category:
          activeCategory && activeCategory !== "__uncategorised"
            ? activeCategory
            : null,
      };
      const note = await createNote(body);
      setAllNotes((prev) => [note, ...prev]);
      setActiveNoteId(note._id);
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  }, [activeCategory]);

  const handleCreateNoteInCategory = useCallback(
    async (categoryName: string | null) => {
      try {
        const body: Partial<Note> = {
          title: "Untitled",
          content: "",
          category:
            categoryName && categoryName !== "__uncategorised"
              ? categoryName
              : null,
        };
        const note = await createNote(body);
        setAllNotes((prev) => [note, ...prev]);
        setActiveNoteId(note._id);
      } catch (err) {
        console.error("Failed to create note:", err);
      }
    },
    [],
  );

  const handleUpdateNote = useCallback((id: string, changes: Partial<Note>) => {
    // Optimistically update local state
    setAllNotes((prev) =>
      prev.map((n) => (n._id === id ? { ...n, ...changes } : n)),
    );

    // Debounced save to backend
    setSaving(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await updateNoteApi(id, changes);
      } catch (err) {
        console.error("Failed to save note:", err);
      } finally {
        setSaving(false);
      }
    }, 400);
  }, []);

  const handleTrashNote = useCallback(
    async (id: string) => {
      try {
        await trashNote(id);
        setAllNotes((prev) =>
          prev.map((n) => (n._id === id ? { ...n, trash: true } : n)),
        );
        if (activeNoteId === id) setActiveNoteId(null);
      } catch (err) {
        console.error("Failed to trash note:", err);
      }
    },
    [activeNoteId],
  );

  const handleRestoreNote = useCallback(async (id: string) => {
    try {
      await restoreNote(id);
      setAllNotes((prev) =>
        prev.map((n) => (n._id === id ? { ...n, trash: false } : n)),
      );
    } catch (err) {
      console.error("Failed to restore note:", err);
    }
  }, []);

  const handleDeleteNote = useCallback(
    async (id: string) => {
      try {
        await deleteNote(id);
        setAllNotes((prev) => prev.filter((n) => n._id !== id));
        if (activeNoteId === id) setActiveNoteId(null);
      } catch (err) {
        console.error("Failed to delete note:", err);
      }
    },
    [activeNoteId],
  );

  const handleEmptyTrash = useCallback(async () => {
    try {
      await emptyTrashApi();
      setAllNotes((prev) => prev.filter((n) => !n.trash));
      setActiveNoteId(null);
    } catch (err) {
      console.error("Failed to empty trash:", err);
    }
  }, []);

  const handleToggleFavorite = useCallback(async (id: string) => {
    try {
      const updated = await toggleFavoriteApi(id);
      setAllNotes((prev) =>
        prev.map((n) =>
          n._id === id ? { ...n, favorite: updated.favorite } : n,
        ),
      );
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  }, []);

  // ─── Category actions ─────────────────────────────────────
  const handleCreateCategory = useCallback(async (name: string) => {
    try {
      const cat = await createCategory(name);
      setCategories((prev) =>
        [...prev, cat].sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return a.name.localeCompare(b.name);
        }),
      );
    } catch (err) {
      console.error("Failed to create category:", err);
    }
  }, []);

  const handleUpdateCategory = useCallback(async (id: string, name: string) => {
    try {
      const cat = await updateCategory(id, name);
      setCategories((prev) =>
        prev
          .map((c) => (c._id === id ? cat : c))
          .sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return a.name.localeCompare(b.name);
          }),
      );
    } catch (err) {
      console.error("Failed to update category:", err);
    }
  }, []);

  const handleDeleteCategory = useCallback(
    async (id: string) => {
      try {
        await deleteCategory(id);
        setCategories((prev) => prev.filter((c) => c._id !== id));
        if (activeCategory) {
          setActiveCategory(null);
        }
      } catch (err) {
        console.error("Failed to delete category:", err);
      }
    },
    [activeCategory],
  );

  const handleTogglePinCategory = useCallback(async (id: string) => {
    try {
      const updated = await togglePinCategoryApi(id);
      setCategories((prev) =>
        prev
          .map((c) => (c._id === id ? updated : c))
          .sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return a.name.localeCompare(b.name);
          }),
      );
    } catch (err) {
      console.error("Failed to toggle pin category:", err);
    }
  }, []);

  // ─── Keyboard shortcuts ───────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === "n") {
        e.preventDefault();
        handleCreateNote();
      }
      if (isMod && e.key === "s") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleCreateNote]);

  // ─── Download note ────────────────────────────────
  const handleDownloadNote = useCallback(
    async (id: string, format: "pdf" | "docx" = "docx") => {
      const note = allNotes.find((n) => n._id === id);
      if (!note) return;

      const title = note.title || "Untitled";

      if (format === "pdf") {
        try {
          const html2pdf = (await import("html2pdf.js")).default;
          
          const container = document.createElement("div");
          container.style.position = "absolute";
          container.style.left = "-9999px";
          container.style.top = "0";
          container.style.width = "800px";
          container.style.backgroundColor = "white";
          container.style.color = "black";
          container.style.padding = "40px";
          
          container.innerHTML = `
            <div style="font-family: sans-serif;">
              <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 24px; border-bottom: 2px solid #eaeaea; padding-bottom: 12px; color: #1a1a1a;">
                ${title}
              </h1>
              <div class="prose max-w-none text-black prose-headings:text-black prose-p:text-black prose-a:text-blue-600 prose-pre:bg-gray-100 prose-pre:text-gray-900 prose-pre:p-4 prose-pre:rounded-lg prose-code:text-gray-800 prose-table:border-collapse prose-td:border prose-td:border-gray-300 prose-td:p-2 prose-th:border prose-th:border-gray-300 prose-th:p-2 prose-th:bg-gray-100">
                ${note.content}
              </div>
            </div>
          `;
          document.body.appendChild(container);

          const opt = {
            margin: 15,
            filename: `${title}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
          };

          await html2pdf().set(opt).from(container).save();
          document.body.removeChild(container);
        } catch (err) {
          console.error("Failed to generate PDF:", err);
        }
      } else {
        const docContent = `
          <html xmlns:o="urn:schemas-microsoft-com:office:office"
                xmlns:w="urn:schemas-microsoft-com:office:word"
                xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <!--[if gte mso 9]>
            <xml>
              <w:WordDocument>
                <w:View>Print</w:View>
                <w:Zoom>100</w:Zoom>
                <w:DoNotOptimizeForBrowser/>
              </w:WordDocument>
            </xml>
            <![endif]-->
            <style>
              body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #1a1a1a; margin: 1in; }
              h1 { font-size: 20pt; font-weight: bold; margin-bottom: 12pt; border-bottom: 1px solid #ccc; padding-bottom: 6pt; }
              h2 { font-size: 16pt; font-weight: bold; margin-bottom: 10pt; }
              h3 { font-size: 13pt; font-weight: bold; margin-bottom: 8pt; }
              table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
              th, td { border: 1px solid #999; padding: 6pt 8pt; text-align: left; }
              th { background-color: #f0f0f0; font-weight: bold; }
              blockquote { border-left: 3px solid #ccc; padding-left: 12pt; font-style: italic; color: #555; }
              code { font-family: Consolas, monospace; font-size: 10pt; background: #f5f5f5; padding: 2pt 4pt; }
              pre { font-family: Consolas, monospace; font-size: 10pt; background: #f5f5f5; padding: 8pt; border-radius: 4pt; }
              mark { background-color: #fff3a8; }
              a { color: #2563eb; }
              img { max-width: 100%; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            ${note.content}
          </body>
          </html>
        `;

        const blob = new Blob(["\ufeff", docContent], {
          type: "application/msword",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title}.doc`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [allNotes],
  );

  // ─── Render ───────────────────────────────────────────────
  if (loading && allNotes.length === 0) {
    return <NotesSkeleton isDocumentView={!!initialDocId} />;
  }

  return (
    <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden bg-white dark:bg-[#0a0a0a]">
      {/* Click overlay to close sidebar on mobile */}
      {sidebarOpen && (
        <div
          className="fixed top-[53px] sm:top-[64px] left-0 right-0 bottom-0 z-40 bg-black/60 backdrop-blur-xl lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - overlay on mobile, inline on desktop */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:z-auto lg:translate-x-0 lg:transition-[width,min-width] lg:duration-200
          ${sidebarOpen ? "lg:w-64 lg:min-w-[256px]" : "lg:w-0 lg:min-w-0 lg:overflow-hidden"}
        `}
      >
        <div className="w-64 min-w-[256px] h-full">
          <NotesSidebar
            view={sidebarView}
            onChangeView={(v: SidebarView) => {
              setSidebarView(v);
              setActiveNoteId(null);
              setActiveCategory(null);
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            categories={categories}
            activeCategory={activeCategory}
            onSelectCategory={(name: string | null) => {
              setActiveCategory(name);
            }}
            onCreateCategory={handleCreateCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onTogglePinCategory={handleTogglePinCategory}
            allNotes={allNotes}
            activeNoteId={activeNoteId}
            onSelectNote={(id: string) => {
              setActiveNoteId(id);
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            onCreateNote={handleCreateNote}
            onTrashNote={handleTrashNote}
            onRestoreNote={handleRestoreNote}
            onDeleteNote={handleDeleteNote}
            onCreateNoteInCategory={handleCreateNoteInCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onCloseSidebar={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      {/* Main content: Grid or Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeNote ? (
          <NoteEditor
            note={activeNote}
            onChange={handleUpdateNote}
            onToggleFavorite={handleToggleFavorite}
            onTrashNote={handleTrashNote}
            onDownloadNote={handleDownloadNote}
            saving={saving}
            onToggleSidebar={() => setSidebarOpen((o) => !o)}
            sidebarOpen={sidebarOpen}
            categories={categories}
            isTrash={sidebarView === "trash"}
            allNotes={allNotes}
            onCreateCategory={handleCreateCategory}
          />
        ) : (
          <NotesGrid
            allNotes={allNotes}
            view={sidebarView}
            activeCategory={activeCategory}
            onSelectNote={(id: string) => {
              setActiveNoteId(id);
              if (window.innerWidth < 1024) setSidebarOpen(false);
            }}
            onCreateNote={handleCreateNote}
            onTrashNote={handleTrashNote}
            onRestoreNote={handleRestoreNote}
            onDeleteNote={handleDeleteNote}
            onToggleFavorite={handleToggleFavorite}
            onEmptyTrash={handleEmptyTrash}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((o) => !o)}
            searchQuery={searchQuery}
          />
        )}
      </div>
    </div>
  );
}
