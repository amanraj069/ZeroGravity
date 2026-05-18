"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Note, NoteCategory, uploadNoteImage } from "@/services/notesService";
import { useEditor, EditorContent } from "@tiptap/react";
import { TableToolbar } from "./components/TableToolbar";

import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TLink from "@tiptap/extension-link";
import TImage from "./extensions/resizableImage";
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
  PanelLeftClose,
  PanelLeft,
  Loader2,
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
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  RemoveFormatting,
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



interface NoteEditorProps {
  note: Note | null;
  onChange: (id: string, changes: Partial<Note>) => void;
  onToggleFavorite: (id: string) => void;
  onTrashNote: (id: string) => void;
  onDownloadNote: (id: string, format: "pdf" | "docx") => void;
  saving: boolean;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  categories: NoteCategory[];
  isTrash: boolean;
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
  allNotes,
  onCreateCategory,
}: NoteEditorProps) {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false);
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
  const [showLineSpacing, setShowLineSpacing] = useState(false);
  const [lineSpacingPos, setLineSpacingPos] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const [titleError, setTitleError] = useState<string | null>(null);
  const [prevTitle, setPrevTitle] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [tablePos, setTablePos] = useState({ top: 0, left: 0 });
  const tableRef = useRef<HTMLDivElement>(null);
  const [hoveredTableGrid, setHoveredTableGrid] = useState({ rows: 0, cols: 0 });
  const [activeTableEl, setActiveTableEl] = useState<HTMLElement | null>(null);
  const [tableMenuCoords, setTableMenuCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [tableWidth, setTableWidth] = useState<number>(0);
  const [showVerticalAlign, setShowVerticalAlign] = useState(false);
  const [verticalAlignPos, setVerticalAlignPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const verticalAlignRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const textColorRef = useRef<HTMLDivElement>(null);
  const lineSpacingRef = useRef<HTMLDivElement>(null);
  const titleErrorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const downloadRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
      TableCell.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            verticalAlign: {
              default: "top",
              parseHTML: (element) => element.style.verticalAlign || "top",
              renderHTML: (attributes) => {
                if (!attributes.verticalAlign) return {};
                return {
                  style: `vertical-align: ${attributes.verticalAlign}`,
                };
              },
            },
          };
        },
      }),
      TableHeader.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            verticalAlign: {
              default: "top",
              parseHTML: (element) => element.style.verticalAlign || "top",
              renderHTML: (attributes) => {
                if (!attributes.verticalAlign) return {};
                return {
                  style: `vertical-align: ${attributes.verticalAlign}`,
                };
              },
            },
          };
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      LineHeight,
    ],
    editable: !isTrash,
    content: note?.content || "",
    onUpdate: ({ editor: ed }) => {
      if (note) {
        onChange(note._id, { content: ed.getHTML() });
      }
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
        if (event.key === "Backspace" && editor) {
          const { selection } = editor.state;
          const parentNode = selection.$anchor.parent;
          if (
            selection.empty &&
            selection.$anchor.parentOffset === 0 &&
            parentNode.textContent.length === 0
          ) {
            if (editor.isActive("taskItem")) {
              event.preventDefault();
              editor.chain().focus().liftListItem("taskItem").run();
              return true;
            }
            if (editor.isActive("listItem")) {
              event.preventDefault();
              editor.chain().focus().liftListItem("listItem").run();
              return true;
            }
          }
        }

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
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) handleImageUpload(file);
            return true;
          }
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;
        const imageFile = Array.from(files).find((f) =>
          f.type.startsWith("image/"),
        );
        if (imageFile) {
          event.preventDefault();
          handleImageUpload(imageFile);
          return true;
        }
        return false;
      },
    },
    immediatelyRender: false,
  });

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
      }, 0);
    } else if (editor && !note) {
      setTimeout(() => {
        if (!editor || editor.isDestroyed) return;
        editor.commands.setContent("", { emitUpdate: false });
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
      if (
        lineSpacingRef.current &&
        !lineSpacingRef.current.contains(e.target as Node)
      ) {
        setShowLineSpacing(false);
      }
      if (
        downloadRef.current &&
        !downloadRef.current.contains(e.target as Node)
      ) {
        setShowDownloadDropdown(false);
      }
      if (
        tableRef.current &&
        !tableRef.current.contains(e.target as Node)
      ) {
        setShowTablePicker(false);
      }
      if (
        verticalAlignRef.current &&
        !verticalAlignRef.current.contains(e.target as Node)
      ) {
        setShowVerticalAlign(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!editor) return;

    const update = () => {
      if (editor.isActive("table")) {
        const { selection } = editor.state;
        try {
          const dom = editor.view.domAtPos(selection.from).node;
          const tableDOM = dom instanceof Element 
            ? dom.closest("table") 
            : dom.parentElement?.closest("table");
          if (tableDOM) {
            setActiveTableEl(tableDOM as HTMLElement);
            return;
          }
        } catch {}
      }
      setActiveTableEl(null);
    };

    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    editor.on("focus", update);
    editor.on("blur", update);

    const timer = setTimeout(update, 100);

    return () => {
      clearTimeout(timer);
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
      editor.off("focus", update);
      editor.off("blur", update);
    };
  }, [editor]);

  useEffect(() => {
    if (!activeTableEl || !editor) return;

    const updatePosition = () => {
      const scrollContainer = activeTableEl.closest(".overflow-y-auto") as HTMLElement;
      if (!scrollContainer) return;
      
      const tableRect = activeTableEl.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      
      const relativeTop = tableRect.top - containerRect.top + scrollContainer.scrollTop;
      const relativeLeft = tableRect.left - containerRect.left + scrollContainer.scrollLeft;
      
      // Position it exactly 38px above the table top edge
      const top = relativeTop - 38; 
      
      setTableMenuCoords({ top, left: relativeLeft });
      setTableWidth(tableRect.width);
    };

    updatePosition();
    
    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(activeTableEl);

    window.addEventListener("resize", updatePosition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updatePosition);
    };
  }, [activeTableEl, editor]);

  // Helper: upload an image file to Cloudinary, then insert into editor
  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor) return;
      // Validate file type
      if (!file.type.startsWith("image/")) return;
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be smaller than 5MB");
        return;
      }

      let localUrl = "";
      try {
        localUrl = URL.createObjectURL(file);
      } catch {
        // Fallback to base64 reader if createObjectURL fails
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            editor.chain().focus().setImage({ src: reader.result, uploading: true } as unknown as { src: string }).run();
          }
        };
        reader.readAsDataURL(file);
        return;
      }

      // 1. Immediately insert image with local blob URL and uploading: true
      editor.chain().focus().setImage({ src: localUrl, uploading: true } as unknown as { src: string }).run();
      setUploadingImage(true);

      // 2. Perform background upload to Cloudinary
      uploadNoteImage(file)
        .then((result) => {
          if (!editor || editor.isDestroyed) return;

          // 3. Swap out localUrl with Cloudinary URL and set uploading: false
          editor.commands.command(({ tr }) => {
            let found = false;
            tr.doc.descendants((node, pos) => {
              if (node.type.name === "image" && node.attrs.src === localUrl) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  src: result.url,
                  uploading: false,
                });
                found = true;
                return false; // stop iteration
              }
              return true;
            });
            return found;
          });
        })
        .catch((err) => {
          console.error("Cloudinary background upload failed, keeping local URL:", err);
          // Set uploading: false to remove loading overlay
          if (!editor || editor.isDestroyed) return;
          editor.commands.command(({ tr }) => {
            let found = false;
            tr.doc.descendants((node, pos) => {
              if (node.type.name === "image" && node.attrs.src === localUrl) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  uploading: false,
                });
                found = true;
                return false;
              }
              return true;
            });
            return found;
          });
        })
        .finally(() => {
          setUploadingImage(false);
        });
    },
    [editor],
  );

  const addLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href || "";
    const url = window.prompt("Enter URL:", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      // Ensure URL has protocol
      const href = url.match(/^https?:\/\//) ? url : `https://${url}`;
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href })
        .run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    if (!editor) return;
    // Open file picker for local images
    imageInputRef.current?.click();
  }, [editor]);

  const handleImageFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleImageUpload(file);
      // Reset input so same file can be re-selected
      e.target.value = "";
    },
    [handleImageUpload],
  );



  const insertCodeBlock = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().toggleCodeBlock({ language: "cpp" }).run();
  }, [editor]);



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
    | { type: "vertical-align-picker" }
    | { type: "table-picker" }
    | {
        icon: React.ComponentType<{ size: number }>;
        action: () => void;
        title: string;
        isActive?: boolean;
        disabled?: boolean;
      };

  const toolbarButtons: TBBtn[] = useMemo(() => {
    if (!editor) return [];
    return [

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
      { icon: Image, action: addImage, title: "Image — Insert image from file" },
      { type: "table-picker" as const },
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
      { type: "vertical-align-picker" as const },
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
    <div className="flex flex-col flex-1 h-full min-h-0">
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageFileSelect}
        accept="image/*"
        className="hidden"
      />
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
          {uploadingImage && (
            <span className="flex items-center gap-1 text-[10px] text-blue-400 mr-2">
              <Loader2 size={12} className="animate-spin" />
              Uploading...
            </span>
          )}
          {saving && (
            <span className="flex items-center gap-1 text-[10px] text-gray-400 mr-2">
              <Loader2 size={12} className="animate-spin" />
              Saving
            </span>
          )}



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

          <div className="relative" ref={downloadRef}>
            <button
              onClick={() => setShowDownloadDropdown((s) => !s)}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded transition-colors"
              title="Download Note"
            >
              <Download size={15} />
            </button>
            {showDownloadDropdown && (
              <div className="absolute right-0 top-full mt-1 z-20 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg py-1 rounded-md">
                <button
                  onClick={() => {
                    onDownloadNote(note._id, "pdf");
                    setShowDownloadDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    onDownloadNote(note._id, "docx");
                    setShowDownloadDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Download DOCX
                </button>
              </div>
            )}
          </div>

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

            // Table Grid Picker
            if ("type" in btn && btn.type === "table-picker") {
              const isTableActive = editor?.isActive("table");
              return (
                <div key="table-picker" className="relative" ref={tableRef}>
                  <button
                    onClick={(e) => {
                      if (isTableActive) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTablePos({ top: rect.bottom + 4, left: rect.left });
                      setShowTablePicker((s) => !s);
                      setShowHighlightPicker(false);
                      setShowTextColorPicker(false);
                      setShowLineSpacing(false);
                      setShowDownloadDropdown(false);
                      setHoveredTableGrid({ rows: 0, cols: 0 });
                    }}
                    disabled={isTableActive}
                    className={`p-1.5 rounded transition-colors flex-shrink-0 flex items-center gap-0.5 ${
                      isTableActive
                        ? "text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50"
                        : showTablePicker
                        ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
                    }`}
                    title={isTableActive ? "Cannot insert a table inside another table" : "Insert table — Hover to choose dimensions"}
                  >
                    <Table size={14} />
                    {!isTableActive && <ChevronDown size={10} />}
                  </button>
                  {showTablePicker && !isTableActive && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowTablePicker(false)}
                      />
                      <div
                        className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2.5 w-[210px] select-none"
                        style={{ top: tablePos.top, left: tablePos.left }}
                      >
                        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1 pb-2">
                          Insert Table Grid
                        </p>
                        <div className="flex flex-col gap-1.5 p-1 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-100 dark:border-gray-800/80">
                          {Array.from({ length: 10 }).map((_, rIdx) => (
                            <div key={rIdx} className="flex gap-1.5 justify-center">
                              {Array.from({ length: 10 }).map((_, cIdx) => {
                                const isHighlighted =
                                  rIdx < hoveredTableGrid.rows &&
                                  cIdx < hoveredTableGrid.cols;
                                return (
                                  <div
                                    key={cIdx}
                                    onMouseEnter={() =>
                                      setHoveredTableGrid({
                                        rows: rIdx + 1,
                                        cols: cIdx + 1,
                                      })
                                    }
                                    onClick={() => {
                                      editor
                                        ?.chain()
                                        .focus()
                                        .insertTable({
                                          rows: rIdx + 1,
                                          cols: cIdx + 1,
                                          withHeaderRow: true,
                                        })
                                        .run();
                                      setShowTablePicker(false);
                                    }}
                                    className={`w-3 h-3 border rounded-sm transition-all duration-75 cursor-pointer ${
                                      isHighlighted
                                        ? "bg-blue-500 border-blue-600 scale-105"
                                        : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          ))}
                        </div>
                        <div className="text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 pt-2 mt-1.5 border-t border-gray-100 dark:border-gray-700">
                          {hoveredTableGrid.rows > 0 && hoveredTableGrid.cols > 0
                            ? `Insert ${hoveredTableGrid.rows} × ${hoveredTableGrid.cols} table`
                            : "Hover grid to set size"}
                        </div>
                      </div>
                    </>
                  )}
                </div>
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
                      setShowLineSpacing(false);
                      setShowDownloadDropdown(false);
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
                      setShowLineSpacing(false);
                      setShowDownloadDropdown(false);
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

            // Vertical alignment picker
            if ("type" in btn && btn.type === "vertical-align-picker") {
              const isTableActive = editor?.isActive("table");
              const currentVal =
                editor?.getAttributes("tableCell").verticalAlign ||
                editor?.getAttributes("tableHeader").verticalAlign ||
                "top";
                
              return (
                <div key="vertical-align-picker" className="relative" ref={verticalAlignRef}>
                  <button
                    onClick={(e) => {
                      if (!isTableActive) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      setVerticalAlignPos({
                        top: rect.bottom + 4,
                        left: rect.left,
                      });
                      setShowVerticalAlign((s) => !s);
                      setShowHighlightPicker(false);
                      setShowTextColorPicker(false);
                      setShowLineSpacing(false);
                      setShowDownloadDropdown(false);
                    }}
                    disabled={!isTableActive}
                    className={`p-1.5 rounded transition-colors flex-shrink-0 flex items-center gap-0.5 ${
                      !isTableActive
                        ? "text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50"
                        : showVerticalAlign
                        ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
                    }`}
                    title={
                      isTableActive
                        ? "Vertical alignment — Align cell content (Top, Middle, Bottom)"
                        : "Vertical alignment (Only available inside tables)"
                    }
                  >
                    <AlignCenterVertical size={14} />
                    {isTableActive && <ChevronDown size={10} />}
                  </button>
                  {showVerticalAlign && isTableActive && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowVerticalAlign(false)}
                      />
                      <div
                        className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-2 w-[140px]"
                        style={{
                          top: verticalAlignPos.top,
                          left: verticalAlignPos.left,
                        }}
                      >
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-2 pb-1.5">
                          Vertical Align
                        </p>
                        {[
                          { label: "Align Top", value: "top", icon: AlignStartVertical },
                          { label: "Align Middle", value: "middle", icon: AlignCenterVertical },
                          { label: "Align Bottom", value: "bottom", icon: AlignEndVertical },
                        ].map((opt) => {
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => {
                                editor
                                  ?.chain()
                                  .focus()
                                  .setCellAttribute("verticalAlign", opt.value)
                                  .run();
                                setShowVerticalAlign(false);
                              }}
                              className={`w-full flex items-center gap-2 text-left px-3 py-1.5 text-xs rounded transition-colors ${
                                currentVal === opt.value
                                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              }`}
                            >
                              <Icon size={13} />
                              {opt.label}
                            </button>
                          );
                        })}
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
                <div key="line-spacing-picker" className="relative" ref={lineSpacingRef}>
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
                      setShowDownloadDropdown(false);
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
                  disabled={btn.disabled}
                  className={`p-1.5 rounded transition-colors flex-shrink-0 ${
                    btn.isActive
                      ? "text-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : btn.disabled
                      ? "text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
                  }`}
                  title={btn.disabled ? "Cannot insert a table inside another table" : btn.title}
                >
                  <Icon size={14} />
                </button>
              );
            }

            return null;
          })}
        </div>
      )}



      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor area flex container */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto relative">
            {editor && activeTableEl && (
              <TableToolbar
                editor={editor}
                tableMenuCoords={tableMenuCoords}
                tableWidth={tableWidth}
              />
            )}
            <EditorContent editor={editor} className="h-full" />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-6 h-[33px] border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] text-[10px] text-gray-400 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span>{charCount} chars</span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <span>{wordCount} words</span>
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
