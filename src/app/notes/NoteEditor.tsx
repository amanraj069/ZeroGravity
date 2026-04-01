"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Note, NoteCategory } from "@/services/notesService";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TLink from "@tiptap/extension-link";
import TImage from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import { Table as TTable } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import LineHeight from "./extensions/lineHeight";
import CustomCodeBlock from "./extensions/customCodeBlock";
import {
  Star,
  Trash2,
  Download,
  Edit3,
  PanelLeftClose,
  PanelLeft,
  Loader2,
  Copy,
  Check,
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Link,
  Image,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  CheckSquare,
  Table,
  Underline as UnderlineIcon,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo2,
  Redo2,
  RemoveFormatting,
  ListCollapse,
  ChevronDown,
  Type,
  Palette,
  ALargeSmall,
  CodeXml,
  Plus,
  X,
  FolderOpen,
} from "lucide-react";

// ─── Line spacing options ───────────────────────────────────
const LINE_SPACING_OPTIONS = [
  { label: "1.0", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "2.0", value: "2" },
  { label: "2.5", value: "2.5" },
  { label: "3.0", value: "3" },
];

// ─── Highlight colours ──────────────────────────────────────
const HIGHLIGHT_COLORS = [
  { name: "Yellow", color: "rgba(254, 240, 138, 0.4)" },
  { name: "Green", color: "rgba(187, 247, 208, 0.4)" },
  { name: "Blue", color: "rgba(191, 219, 254, 0.45)" },
  { name: "Pink", color: "rgba(254, 205, 211, 0.45)" },
  { name: "Purple", color: "rgba(233, 213, 255, 0.45)" },
  { name: "Orange", color: "rgba(254, 215, 170, 0.45)" },
  { name: "Red", color: "rgba(254, 202, 202, 0.45)" },
  { name: "Cyan", color: "rgba(165, 243, 252, 0.4)" },
];

const TEXT_COLORS = [
  { name: "Default", color: "" },
  { name: "Red", color: "#ef4444" },
  { name: "Orange", color: "#f97316" },
  { name: "Yellow", color: "#eab308" },
  { name: "Green", color: "#22c55e" },
  { name: "Blue", color: "#3b82f6" },
  { name: "Purple", color: "#a855f7" },
  { name: "Pink", color: "#ec4899" },
  { name: "Gray", color: "#6b7280" },
];

// ─── Heading type for outline ───────────────────────────────
interface HeadingItem {
  level: number;
  text: string;
  pos: number;
}

interface NoteEditorProps {
  note: Note | null;
  onChange: (id: string, changes: Partial<Note>) => void;
  onToggleFavorite: (id: string) => void;
  onTrashNote: (id: string) => void;
  onDownloadNote: (id: string) => void;
  saving: boolean;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  categories: NoteCategory[];
  isTrash: boolean;
  onBack: () => void;
  allNotes: Note[];
  onCreateCategory: (name: string) => void;
}

export default function NoteEditor({
  note,
  onChange,
  onToggleFavorite,
  onTrashNote,
  onDownloadNote,
  saving,
  onToggleSidebar,
  sidebarOpen,
  categories,
  isTrash,
  onBack,
  allNotes,
  onCreateCategory,
}: NoteEditorProps) {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [addingCatInEditor, setAddingCatInEditor] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [textColorPos, setTextColorPos] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const [showOutline, setShowOutline] = useState(false);
  const [showLineSpacing, setShowLineSpacing] = useState(false);
  const [lineSpacingPos, setLineSpacingPos] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [prevTitle, setPrevTitle] = useState<string>("");
  const highlightRef = useRef<HTMLDivElement>(null);
  const textColorRef = useRef<HTMLDivElement>(null);
  const titleErrorTimerRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false, // We use CustomCodeBlock instead
      }),
      CustomCodeBlock,
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      TLink.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-500 underline cursor-pointer" },
      }),
      TImage.configure({ inline: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: "Start writing…" }),
      TTable.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      LineHeight,
    ],
    editable: !isTrash,
    content: note?.content || "",
    onUpdate: ({ editor: ed }) => {
      if (note) {
        onChange(note._id, { content: ed.getHTML() });
      }
      // Update headings for outline
      extractHeadings(ed);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-full px-6 py-4 " +
          "prose-headings:font-semibold prose-a:text-blue-500 prose-img:rounded-lg " +
          "prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-code:text-sm " +
          "prose-code:before:content-none prose-code:after:content-none " +
          "prose-table:border-collapse prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-600 prose-td:p-2 " +
          "prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-600 prose-th:p-2 prose-th:bg-gray-100 dark:prose-th:bg-gray-800",
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          if (event.shiftKey) {
            // Shift+Tab: try to lift list item or do nothing
            editor?.chain().focus().liftListItem("listItem").run();
          } else {
            // Check if we're in a list — if so, sink the list item
            if (editor?.isActive("listItem")) {
              editor.chain().focus().sinkListItem("listItem").run();
            } else {
              // Otherwise insert a tab character (4 spaces)
              editor
                ?.chain()
                .focus()
                .insertContent("\u00A0\u00A0\u00A0\u00A0")
                .run();
            }
          }
          return true;
        }
        return false;
      },
    },
    immediatelyRender: false,
  });

  // Extract headings from editor for document outline
  const extractHeadings = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ed: any) => {
      const items: HeadingItem[] = [];
      ed.state.doc.descendants(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (node: any, pos: number) => {
          if (node.type.name === "heading") {
            items.push({
              level: node.attrs.level,
              text: node.textContent,
              pos,
            });
          }
        },
      );
      setHeadings(items);
    },
    [],
  );

  // Sync content when active note changes
  useEffect(() => {
    if (editor && note) {
      // Use setTimeout to defer the flushSync/update logic out of the current render cycle.
      setTimeout(() => {
        if (!editor || editor.isDestroyed) return;
        const currentHTML = editor.getHTML();
        if (currentHTML !== note.content) {
          editor.commands.setContent(note.content || "", { emitUpdate: false });
        }
        editor.setEditable(!isTrash);
        extractHeadings(editor);
      }, 0);
    } else if (editor && !note) {
      setTimeout(() => {
        if (!editor || editor.isDestroyed) return;
        editor.commands.setContent("", { emitUpdate: false });
        setHeadings([]);
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?._id, isTrash]);

  // Track previous title for duplicate detection
  useEffect(() => {
    if (note) {
      setPrevTitle(note.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?._id]);

  // Handle title changes with duplicate detection
  const handleTitleChange = useCallback(
    (newTitle: string) => {
      if (!note) return;
      // Allow typing freely - save optimistically
      onChange(note._id, { title: newTitle });
    },
    [note, onChange],
  );

  // On blur: check for duplicates and revert if needed
  const handleTitleBlur = useCallback(() => {
    if (!note) return;
    const trimmed = note.title.trim();
    if (trimmed === "") return; // Allow empty
    const duplicate = allNotes.find(
      (n) => n._id !== note._id && n.title.trim() === trimmed,
    );
    if (duplicate) {
      setTitleError("A note with this name already exists");
      if (titleErrorTimerRef.current) clearTimeout(titleErrorTimerRef.current);
      titleErrorTimerRef.current = setTimeout(() => setTitleError(null), 2500);
      onChange(note._id, { title: prevTitle });
    } else {
      setPrevTitle(trimmed);
    }
  }, [note, allNotes, prevTitle, onChange]);

  // Close pickers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        highlightRef.current &&
        !highlightRef.current.contains(e.target as Node)
      ) {
        setShowHighlightPicker(false);
      }
      if (
        textColorRef.current &&
        !textColorRef.current.contains(e.target as Node)
      ) {
        setShowTextColorPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href || "";
    const url = window.prompt("Enter URL:", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const insertTable = useCallback(() => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  const insertCodeBlock = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleCodeBlock({ language: "cpp" }).run();
  }, [editor]);

  const scrollToHeading = useCallback(
    (pos: number) => {
      if (!editor) return;
      editor.chain().focus().setTextSelection(pos).run();
      // Scroll the editor view to the heading
      const domAtPos = editor.view.domAtPos(pos);
      const node = domAtPos.node as HTMLElement;
      const el = node.nodeType === 3 ? node.parentElement : node;
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [editor],
  );

  // Word / char count
  const text = editor?.getText() || "";
  const charCount = text.length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // ─── Toolbar ──────────────────────────────────────────────
  type TBBtn =
    | { type: "divider" }
    | { type: "highlight-picker" }
    | { type: "text-color-picker" }
    | { type: "line-spacing-picker" }
    | {
        icon: React.ComponentType<{ size: number }>;
        action: () => void;
        title: string;
        isActive?: boolean;
      };

  const toolbarButtons: TBBtn[] = useMemo(() => {
    if (!editor) return [];
    return [
      {
        icon: Undo2,
        action: () => editor.chain().focus().undo().run(),
        title: "Undo — Reverse your last action (⌘Z)",
      },
      {
        icon: Redo2,
        action: () => editor.chain().focus().redo().run(),
        title: "Redo — Restore undone action (⌘⇧Z)",
      },
      { type: "divider" as const },
      {
        icon: Bold,
        action: () => editor.chain().focus().toggleBold().run(),
        title: "Bold — Make text bold (⌘B)",
        isActive: editor.isActive("bold"),
      },
      {
        icon: Italic,
        action: () => editor.chain().focus().toggleItalic().run(),
        title: "Italic — Emphasize text (⌘I)",
        isActive: editor.isActive("italic"),
      },
      {
        icon: UnderlineIcon,
        action: () => editor.chain().focus().toggleUnderline().run(),
        title: "Underline — Underline text (⌘U)",
        isActive: editor.isActive("underline"),
      },
      {
        icon: Strikethrough,
        action: () => editor.chain().focus().toggleStrike().run(),
        title: "Strikethrough — Cross out text",
        isActive: editor.isActive("strike"),
      },
      { type: "highlight-picker" as const },
      { type: "text-color-picker" as const },
      {
        icon: Code,
        action: () => editor.chain().focus().toggleCode().run(),
        title: "Inline code — Format as code snippet",
        isActive: editor.isActive("code"),
      },
      { type: "divider" as const },
      {
        icon: Heading1,
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        title: "Heading 1 — Main section title",
        isActive: editor.isActive("heading", { level: 1 }),
      },
      {
        icon: Heading2,
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        title: "Heading 2 — Sub-section title",
        isActive: editor.isActive("heading", { level: 2 }),
      },
      {
        icon: Heading3,
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        title: "Heading 3 — Minor section title",
        isActive: editor.isActive("heading", { level: 3 }),
      },
      { type: "divider" as const },
      {
        icon: List,
        action: () => editor.chain().focus().toggleBulletList().run(),
        title: "Bullet list — Unordered list of items",
        isActive: editor.isActive("bulletList"),
      },
      {
        icon: ListOrdered,
        action: () => editor.chain().focus().toggleOrderedList().run(),
        title: "Numbered list — Ordered list of items",
        isActive: editor.isActive("orderedList"),
      },
      {
        icon: CheckSquare,
        action: () => editor.chain().focus().toggleTaskList().run(),
        title: "Task list — Checklist with checkboxes",
        isActive: editor.isActive("taskList"),
      },
      { type: "divider" as const },
      {
        icon: Quote,
        action: () => editor.chain().focus().toggleBlockquote().run(),
        title: "Blockquote — Indent as a quote",
        isActive: editor.isActive("blockquote"),
      },
      {
        icon: Minus,
        action: () => editor.chain().focus().setHorizontalRule().run(),
        title: "Horizontal rule — Visual divider line",
      },
      {
        icon: Link,
        action: addLink,
        title: "Link — Add or edit a hyperlink",
        isActive: editor.isActive("link"),
      },
      { icon: Image, action: addImage, title: "Image — Insert image from URL" },
      {
        icon: Table,
        action: insertTable,
        title: "Insert table — Add a 3×3 table",
      },
      {
        icon: CodeXml,
        action: insertCodeBlock,
        title: "Code block — Insert a code section with syntax highlighting",
        isActive: editor.isActive("codeBlock"),
      },
      { type: "divider" as const },
      {
        icon: AlignLeft,
        action: () => editor.chain().focus().setTextAlign("left").run(),
        title: "Align left — Left-align text",
        isActive: editor.isActive({ textAlign: "left" }),
      },
      {
        icon: AlignCenter,
        action: () => editor.chain().focus().setTextAlign("center").run(),
        title: "Align center — Center-align text",
        isActive: editor.isActive({ textAlign: "center" }),
      },
      {
        icon: AlignRight,
        action: () => editor.chain().focus().setTextAlign("right").run(),
        title: "Align right — Right-align text",
        isActive: editor.isActive({ textAlign: "right" }),
      },
      { type: "line-spacing-picker" as const },
      { type: "divider" as const },
      {
        icon: RemoveFormatting,
        action: () => editor.chain().focus().clearNodes().unsetAllMarks().run(),
        title: "Clear formatting — Remove all styles from selected text",
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, editor?.state]);

  // ─── Empty state ──────────────────────────────────────────
  if (!note) {
    return null;
  }

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-3 min-h-[42px] border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] flex-shrink-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded transition-colors flex-shrink-0"
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            {sidebarOpen ? (
              <PanelLeftClose size={16} />
            ) : (
              <PanelLeft size={16} />
            )}
          </button>

          <div className="flex-1 min-w-0 relative">
            <input
              type="text"
              value={note.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onFocus={() => setPrevTitle(note.title)}
              onBlur={handleTitleBlur}
              className="text-sm font-medium bg-transparent text-gray-900 dark:text-white focus:outline-none border-none min-w-0 w-full"
              placeholder="Untitled"
              disabled={isTrash}
            />
            {titleError && (
              <span className="absolute left-0 top-full mt-0.5 text-[10px] text-red-500 font-medium whitespace-nowrap animate-pulse">
                {titleError}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {saving && (
            <span className="flex items-center gap-1 text-[10px] text-gray-400 mr-2">
              <Loader2 size={12} className="animate-spin" />
              Saving
            </span>
          )}

          {/* Document outline toggle */}
          <button
            onClick={() => setShowOutline((o) => !o)}
            className={`p-1.5 rounded transition-colors ${
              showOutline
                ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "text-gray-400 hover:text-gray-700 dark:hover:text-white"
            }`}
            title="Document outline — Navigate sections by headings"
          >
            <ListCollapse size={15} />
          </button>

          {!isTrash && (
            <div className="relative">
              <button
                onClick={() => setShowCategoryDropdown((s) => !s)}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] border rounded transition-colors ${
                  note.category
                    ? "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                    : "border-gray-200 dark:border-gray-700 text-gray-400"
                } hover:border-gray-400 dark:hover:border-gray-500`}
                title={note.category || "No category"}
              >
                <FolderOpen size={11} />
                <span className="max-w-[80px] truncate">
                  {note.category || "—"}
                </span>
              </button>
              {showCategoryDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowCategoryDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-20 min-w-[140px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg py-1 rounded-md">
                    <button
                      onClick={() => {
                        onChange(note._id, {
                          category: null as unknown as string,
                        });
                        setShowCategoryDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      No category
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => {
                          onChange(note._id, { category: cat.name });
                          setShowCategoryDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          note.category === cat.name
                            ? "text-gray-900 dark:text-white font-medium"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                    <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
                      {addingCatInEditor ? (
                        <div className="flex items-center gap-1 px-2 py-1">
                          <input
                            type="text"
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && newCatName.trim()) {
                                onCreateCategory(newCatName.trim());
                                onChange(note._id, {
                                  category: newCatName.trim(),
                                });
                                setNewCatName("");
                                setAddingCatInEditor(false);
                                setShowCategoryDropdown(false);
                              }
                              if (e.key === "Escape") {
                                setNewCatName("");
                                setAddingCatInEditor(false);
                              }
                            }}
                            autoFocus
                            placeholder="Category name"
                            className="flex-1 min-w-0 text-xs px-2 py-1 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                          />
                          <button
                            onClick={() => {
                              if (newCatName.trim()) {
                                onCreateCategory(newCatName.trim());
                                onChange(note._id, {
                                  category: newCatName.trim(),
                                });
                                setNewCatName("");
                                setAddingCatInEditor(false);
                                setShowCategoryDropdown(false);
                              }
                            }}
                            className="p-1 text-green-600 hover:text-green-700"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => {
                              setNewCatName("");
                              setAddingCatInEditor(false);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingCatInEditor(true)}
                          className="w-full text-left px-3 py-1.5 text-xs text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-1.5"
                        >
                          <Plus size={12} />
                          New category
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {!isTrash && (
            <button
              onClick={() => onToggleFavorite(note._id)}
              className="p-1.5 text-gray-400 hover:text-yellow-500 rounded transition-colors"
              title={
                note.favorite ? "Remove from favorites" : "Add to favorites"
              }
            >
              <Star
                size={15}
                className={
                  note.favorite ? "fill-yellow-500 text-yellow-500" : ""
                }
              />
            </button>
          )}

          <button
            onClick={() => onDownloadNote(note._id)}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded transition-colors"
            title="Download as .doc"
          >
            <Download size={15} />
          </button>

          {!isTrash && (
            <button
              onClick={() => onTrashNote(note._id)}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
              title="Move to trash"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Formatting toolbar */}
      {!isTrash && (
        <div className="flex items-center gap-0.5 px-3 min-h-[38px] border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111111] flex-shrink-0 overflow-x-auto">
          {toolbarButtons.map((btn, idx) => {
            if ("type" in btn && btn.type === "divider") {
              return (
                <div
                  key={`div-${idx}`}
                  className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1 flex-shrink-0"
                />
              );
            }

            // Highlight color picker
            if ("type" in btn && btn.type === "highlight-picker") {
              return (
                <div
                  key="highlight-picker"
                  className="relative"
                  ref={highlightRef}
                >
                  <button
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setPickerPos({ top: rect.bottom + 4, left: rect.left });
                      setShowHighlightPicker((s) => !s);
                      setShowTextColorPicker(false);
                    }}
                    className={`p-1.5 rounded transition-colors flex-shrink-0 flex items-center gap-0.5 ${
                      editor?.isActive("highlight")
                        ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
                    }`}
                    title="Highlight color — Add background color to text"
                  >
                    <Highlighter size={14} />
                    <ChevronDown size={10} />
                  </button>
                  {showHighlightPicker && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowHighlightPicker(false)}
                      />
                      <div
                        className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2.5 w-[200px]"
                        style={{ top: pickerPos.top, left: pickerPos.left }}
                      >
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-1 pb-2">
                          Highlight Color
                        </p>
                        <div className="grid grid-cols-4 gap-1.5">
                          {HIGHLIGHT_COLORS.map((c) => (
                            <button
                              key={c.name}
                              onClick={() => {
                                editor
                                  ?.chain()
                                  .focus()
                                  .toggleHighlight({ color: c.color })
                                  .run();
                                setShowHighlightPicker(false);
                              }}
                              className="w-9 h-9 rounded-md border-2 border-transparent hover:border-gray-400 dark:hover:border-gray-300 hover:scale-110 transition-all relative"
                              style={{ backgroundColor: c.color }}
                              title={c.name}
                            >
                              {editor?.isActive("highlight", {
                                color: c.color,
                              }) && (
                                <Check
                                  size={16}
                                  className="absolute inset-0 m-auto text-gray-800"
                                  strokeWidth={3}
                                />
                              )}
                            </button>
                          ))}
                        </div>
                        {editor?.isActive("highlight") && (
                          <button
                            onClick={() => {
                              editor?.chain().focus().unsetHighlight().run();
                              setShowHighlightPicker(false);
                            }}
                            className="w-full mt-2 text-[11px] text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                          >
                            Remove highlight
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            }

            // Text color picker
            if ("type" in btn && btn.type === "text-color-picker") {
              return (
                <div
                  key="text-color-picker"
                  className="relative"
                  ref={textColorRef}
                >
                  <button
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTextColorPos({
                        top: rect.bottom + 4,
                        left: rect.left,
                      });
                      setShowTextColorPicker((s) => !s);
                      setShowHighlightPicker(false);
                    }}
                    className={`p-1.5 rounded transition-colors flex-shrink-0 flex items-center gap-0.5 ${
                      editor?.getAttributes("textStyle").color
                        ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
                    }`}
                    title="Text color — Change text color"
                  >
                    <Palette size={14} />
                    <ChevronDown size={10} />
                  </button>
                  {showTextColorPicker && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowTextColorPicker(false)}
                      />
                      <div
                        className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2.5 w-[200px]"
                        style={{
                          top: textColorPos.top,
                          left: textColorPos.left,
                        }}
                      >
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-1 pb-2">
                          Text Color
                        </p>
                        <div className="grid grid-cols-5 gap-1.5">
                          {TEXT_COLORS.map((c) => (
                            <button
                              key={c.name}
                              onClick={() => {
                                if (c.color === "") {
                                  editor?.chain().focus().unsetColor().run();
                                } else {
                                  editor
                                    ?.chain()
                                    .focus()
                                    .setColor(c.color)
                                    .run();
                                }
                                setShowTextColorPicker(false);
                              }}
                              className="w-9 h-9 rounded-md border-2 border-transparent hover:border-gray-400 dark:hover:border-gray-300 hover:scale-110 transition-all relative flex items-center justify-center"
                              style={{
                                backgroundColor:
                                  c.color === ""
                                    ? "transparent"
                                    : c.color + "20",
                              }}
                              title={c.name}
                            >
                              <Type
                                size={16}
                                style={{
                                  color: c.color === "" ? undefined : c.color,
                                }}
                                className={
                                  c.color === ""
                                    ? "text-gray-600 dark:text-gray-300"
                                    : ""
                                }
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            }

            // Line spacing picker
            if ("type" in btn && btn.type === "line-spacing-picker") {
              const currentLineHeight =
                editor?.getAttributes("paragraph").lineHeight ||
                editor?.getAttributes("heading").lineHeight ||
                null;
              return (
                <div key="line-spacing-picker" className="relative">
                  <button
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setLineSpacingPos({
                        top: rect.bottom + 4,
                        left: rect.left,
                      });
                      setShowLineSpacing((s) => !s);
                      setShowHighlightPicker(false);
                      setShowTextColorPicker(false);
                    }}
                    className={`p-1.5 rounded transition-colors flex-shrink-0 flex items-center gap-0.5 ${
                      currentLineHeight
                        ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
                    }`}
                    title="Line spacing — Adjust distance between lines"
                  >
                    <ALargeSmall size={14} />
                    <ChevronDown size={10} />
                  </button>
                  {showLineSpacing && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowLineSpacing(false)}
                      />
                      <div
                        className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2 w-[140px]"
                        style={{
                          top: lineSpacingPos.top,
                          left: lineSpacingPos.left,
                        }}
                      >
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 pb-1.5">
                          Line Spacing
                        </p>
                        {LINE_SPACING_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              editor
                                ?.chain()
                                .focus()
                                .setLineHeight(opt.value)
                                .run();
                              setShowLineSpacing(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs rounded transition-colors ${
                              currentLineHeight === opt.value
                                ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                        {currentLineHeight && (
                          <button
                            onClick={() => {
                              editor?.chain().focus().unsetLineHeight().run();
                              setShowLineSpacing(false);
                            }}
                            className="w-full mt-1.5 text-[11px] text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                          >
                            Reset to default
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            }

            // Regular button
            if (!("type" in btn)) {
              const Icon = btn.icon;
              return (
                <button
                  key={idx}
                  onClick={btn.action}
                  className={`p-1.5 rounded transition-colors flex-shrink-0 ${
                    btn.isActive
                      ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
                  }`}
                  title={btn.title}
                >
                  <Icon size={14} />
                </button>
              );
            }

            return null;
          })}
        </div>
      )}

      {/* Main content area with optional outline */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor area flex container */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <EditorContent editor={editor} className="h-full" />
          </div>
        </div>

        {/* Document outline panel */}
        {showOutline && (
          <div className="w-56 min-w-[224px] border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111111] overflow-y-auto flex-shrink-0">
            <div className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Document Outline
              </h3>
            </div>
            {headings.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <p className="text-xs text-gray-400 dark:text-gray-600 italic">
                  Add headings (H1, H2, H3) to create a document outline
                </p>
              </div>
            ) : (
              <nav className="py-1">
                {headings.map((h, i) => (
                  <button
                    key={`${h.pos}-${i}`}
                    onClick={() => scrollToHeading(h.pos)}
                    className="w-full text-left py-1.5 pr-3 text-xs hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white truncate"
                    style={{
                      paddingLeft: `${(h.level - 1) * 12 + 12}px`,
                    }}
                    title={h.text}
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-bold flex-shrink-0 px-1 py-0.5 rounded ${
                          h.level === 1
                            ? "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                            : h.level === 2
                              ? "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400"
                              : "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        H{h.level}
                      </span>
                      <span className="truncate">
                        {h.text || "Untitled heading"}
                      </span>
                    </span>
                  </button>
                ))}
              </nav>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-6 h-[33px] border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] text-[10px] text-gray-400 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span>{charCount} chars</span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <span>{wordCount} words</span>
          {headings.length > 0 && (
            <>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span>
                {headings.length} section{headings.length > 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
        <span>
          {new Date(note.lastUpdatedDate).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
