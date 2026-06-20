import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Trash2,
  ChevronLeft,
  LayoutGrid,
  PanelLeftClose,
  PanelLeft,
  Calendar,
  CheckSquare,
  Pencil,
  Share2,
  Users,
  Search,
  Crown,
  Eye,
  UserMinus,
} from "lucide-react";
import { getSocket } from "@/services/socketClient";
import { useAuth } from "@/contexts/AuthContext";
import {
  Board,
  Card,
  Collaborator,
  UserSearchResult,
  ChecklistItem,
  fetchBoards,
  fetchBoardWithCards,
  createBoard,
  updateBoard as updateBoardApi,
  deleteBoard,
  addColumn,
  updateColumn as updateColumnApi,
  deleteColumn,
  createCard,
  reorderCards,
  trashCard,
  getCollaborators,
  addCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
  searchUsers,
} from "@/services/orbitBoardService";

const BOARD_EMOJIS = ["🚀", "✨", "🎯", "💡", "🎨", "📈", "🛠️", "🔥", "🌟", "📚"];

const PRIORITY_COLORS = {
  high: {
    dot: "bg-red-500",
    pill: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  },
  medium: {
    dot: "bg-yellow-500",
    pill: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
  },
  low: {
    dot: "bg-green-500",
    pill: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  },
};

// ─── Modal shell — reused for New Board, Add Column, Create Card ─────
function ModalShell({
  title,
  onClose,
  children,
  footer,
  maxW = "max-w-sm",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  maxW?: string;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`bg-white dark:bg-[#111113] rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl w-full ${maxW} overflow-visible`}
      >
        <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02] rounded-t-2xl">
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
        {footer && (
          <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex justify-end gap-2 rounded-b-2xl">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Shared input style ──────────────────────────────────────────────
const INPUT_CLASS =
  "w-full text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-gray-400";

const BTN_PRIMARY = "px-4 py-2 text-xs font-medium bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const BTN_SECONDARY = "px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors";
const BTN_DANGER = "px-4 py-2 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors";

export default function OrbitBoard() {
  const { isLoggedIn, isLoading: authLoading, user, refreshPoints } = useAuth();
  const router = useRouter();

  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [presence, setPresence] = useState<{userId: string; name: string}[]>([]);
  const [userRole, setUserRole] = useState<"owner" | "editor" | "viewer">("owner");
  const [isOwner, setIsOwner] = useState(true);

  // ─── Sidebar — matching Notes pattern exactly ──────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") return window.innerWidth >= 1024;
    return true;
  });
  const [showNewBoardInput, setShowNewBoardInput] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

  // ─── Add Column modal ─────────────────────────────────────────────
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  // ─── Drag & drop ──────────────────────────────────────────────────
  const [draggedCard, setDraggedCard] = useState<Card | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<"top" | "bottom" | null>(null);

  // ─── Create Card modal ────────────────────────────────────────────
  const [showNewCardModal, setShowNewCardModal] = useState(false);
  const [newCardColumnId, setNewCardColumnId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardPriority, setNewCardPriority] = useState<"low" | "medium" | "high" | null>(null);
  const [newCardDueDate, setNewCardDueDate] = useState("");
  const [newCardTags, setNewCardTags] = useState<string[]>([]);
  const [newCardTagInput, setNewCardTagInput] = useState("");
  const [newCardChecklist, setNewCardChecklist] = useState<ChecklistItem[]>([]);
  const [newCardChecklistInput, setNewCardChecklistInput] = useState("");

  // ─── Board context menu ───────────────────────────────────────────

  // ─── Inline rename (sidebar) ──────────────────────────────────────
  const [renamingBoardId, setRenamingBoardId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // ─── Header rename ────────────────────────────────────────────────
  const [editingHeaderName, setEditingHeaderName] = useState(false);
  const [headerNameValue, setHeaderNameValue] = useState("");

  // ─── Column rename ────────────────────────────────────────────────
  const [renamingColumnId, setRenamingColumnId] = useState<string | null>(null);
  const [columnRenameValue, setColumnRenameValue] = useState("");

  // ─── Delete confirmation modal ────────────────────────────────────
  const [deleteBoardTarget, setDeleteBoardTarget] = useState<Board | null>(null);

  // ─── Share modal ──────────────────────────────────────────────────
  const [showShareModal, setShowShareModal] = useState(false);
  const [boardSearchQuery, setBoardSearchQuery] = useState("");
  const [shareSearchQuery, setShareSearchQuery] = useState("");
  const [shareSearchResults, setShareSearchResults] = useState<UserSearchResult[]>([]);
  const [shareSearching, setShareSearching] = useState(false);
  const [shareRole, setShareRole] = useState<"editor" | "viewer">("editor");
  const [collaboratorsList, setCollaboratorsList] = useState<{ owner: UserSearchResult | null; collaborators: Collaborator[] }>({ owner: null, collaborators: [] });
  const [shareError, setShareError] = useState("");

  const canEdit = userRole === "owner" || userRole === "editor";

  // ─── Close context menu on outside click ──────────────────────────

  // ─── Auto-reopen sidebar on mobile→desktop (matching Notes) ───────
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

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/login");
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const init = async () => {
      try {
        setLoading(true);
        let boardList = await fetchBoards();
        if (boardList.length === 0) {
          const newBoard = await createBoard("My Board", "🚀");
          boardList = [newBoard];
        }
        setBoards(boardList);
        const defaultBoard = boardList.find((b) => b.isDefault) || boardList[0];
        if (defaultBoard) setActiveBoardId(defaultBoard._id);
      } catch (err) {
        console.error("Failed to load boards:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!activeBoardId) return;
    const loadBoard = async () => {
      try {
        const data = await fetchBoardWithCards(activeBoardId);
        setActiveBoard(data.board);
        setCards(data.cards);
        setIsOwner(data.isOwner);
        setUserRole(data.userRole);
      } catch (err) {
        console.error("Failed to load board:", err);
      }
    };
    loadBoard();

    // Setup Socket
    const socket = getSocket();
    const handlePresence = (users: {userId: string; name: string}[]) => setPresence(users);
    const handleUpdate = () => loadBoard();

    socket.emit("board:join", { boardId: activeBoardId, user: { userId: user?._id, name: user?.username } });
    socket.on("board:presence", handlePresence);
    socket.on("board:update", handleUpdate);

    const handleReconnect = () => {
      socket.emit("board:join", { boardId: activeBoardId, user: { userId: user?._id, name: user?.username } });
      loadBoard();
    };
    socket.on("connect", handleReconnect);

    return () => {
      socket.emit("board:leave", { boardId: activeBoardId });
      socket.off("board:presence", handlePresence);
      socket.off("board:update", handleUpdate);
      socket.off("connect", handleReconnect);
      setPresence([]);
    };
  }, [activeBoardId, user]);

  // ─── Debounced user search for share modal ────────────────────────
  useEffect(() => {
    if (shareSearchQuery.trim().length < 2) {
      setShareSearchResults([]);
      return;
    }
    setShareSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const results = await searchUsers(shareSearchQuery.trim());
        // Filter out users already in collaborators
        const existingIds = collaboratorsList.collaborators.map(c => c.userId);
        setShareSearchResults(results.filter(r => !existingIds.includes(r.userId)));
      } catch (err) {
        console.error("Failed to search users:", err);
      } finally {
        setShareSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [shareSearchQuery, collaboratorsList.collaborators]);

  // ─── Board CRUD ───────────────────────────────────────────────────
  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    try {
      const board = await createBoard(
        newBoardName.trim(),
        BOARD_EMOJIS[Math.floor(Math.random() * BOARD_EMOJIS.length)]
      );
      setBoards((prev) => [...prev, board]);
      setActiveBoardId(board._id);
      setNewBoardName("");
      setShowNewBoardInput(false);
    } catch (err) {
      console.error("Failed to create board:", err);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    try {
      await deleteBoard(boardId);
      setBoards((prev) => prev.filter((b) => b._id !== boardId));
      if (activeBoardId === boardId) {
        const remaining = boards.filter((b) => b._id !== boardId);
        setActiveBoardId(remaining[0]?._id || null);
      }
      setDeleteBoardTarget(null);
    } catch (err) {
      console.error("Failed to delete board:", err);
    }
  };

  const handleRenameBoard = async (boardId: string, newName: string) => {
    if (!newName.trim()) {
      setRenamingBoardId(null);
      return;
    }
    try {
      const updated = await updateBoardApi(boardId, { name: newName.trim() });
      setBoards((prev) => prev.map((b) => b._id === boardId ? { ...b, name: updated.name } : b));
      if (activeBoardId === boardId && activeBoard) {
        setActiveBoard({ ...activeBoard, name: updated.name });
      }
      setRenamingBoardId(null);
    } catch (err) {
      console.error("Failed to rename board:", err);
    }
  };

  const handleRenameHeader = async () => {
    if (!activeBoardId || !headerNameValue.trim()) {
      setEditingHeaderName(false);
      return;
    }
    try {
      const updated = await updateBoardApi(activeBoardId, { name: headerNameValue.trim() });
      setBoards((prev) => prev.map((b) => b._id === activeBoardId ? { ...b, name: updated.name } : b));
      if (activeBoard) setActiveBoard({ ...activeBoard, name: updated.name });
      setEditingHeaderName(false);
    } catch (err) {
      console.error("Failed to rename board:", err);
    }
  };

  // ─── Column CRUD ──────────────────────────────────────────────────
  const handleAddColumn = async () => {
    if (!activeBoardId || !newColumnName.trim()) return;
    try {
      const updated = await addColumn(activeBoardId, newColumnName.trim());
      setActiveBoard(updated);
      setNewColumnName("");
      setShowAddColumnModal(false);
    } catch (err) {
      console.error("Failed to add column:", err);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!activeBoardId) return;
    if (!confirm("Delete this column? Cards will be moved to the first column.")) return;
    try {
      const updated = await deleteColumn(activeBoardId, columnId);
      setActiveBoard(updated);
      const data = await fetchBoardWithCards(activeBoardId);
      setCards(data.cards);
    } catch (err) {
      console.error("Failed to delete column:", err);
    }
  };

  const handleRenameColumn = async (columnId: string, newName: string) => {
    if (!activeBoardId || !newName.trim()) {
      setRenamingColumnId(null);
      return;
    }
    try {
      const updated = await updateColumnApi(activeBoardId, columnId, newName.trim());
      setActiveBoard(updated);
      setRenamingColumnId(null);
    } catch (err) {
      console.error("Failed to rename column:", err);
    }
  };

  // ─── Card CRUD ────────────────────────────────────────────────────
  const handleOpenNewCardModal = (columnId: string) => {
    setNewCardColumnId(columnId);
    setNewCardTitle("");
    setNewCardPriority(null);
    setNewCardDueDate("");
    setNewCardTags([]);
    setNewCardTagInput("");
    setNewCardChecklist([]);
    setNewCardChecklistInput("");
    setShowNewCardModal(true);
  };

  const handleCreateCard = async () => {
    if (!activeBoardId || !newCardColumnId || !newCardTitle.trim()) return;
    try {
      const card = await createCard(activeBoardId, {
        title: newCardTitle.trim(),
        content: "",
        columnId: newCardColumnId,
        cardType: newCardChecklist.length > 0 ? "checklist" : "note",
        priority: newCardPriority,
        dueDate: newCardDueDate || null,
        tags: newCardTags,
        checklist: newCardChecklist,
        assignee: null,
      });
      setCards((prev) => [card, ...prev]);
      setShowNewCardModal(false);
    } catch (err) {
      console.error("Failed to create card:", err);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!activeBoardId) return;
    try {
      await trashCard(activeBoardId, cardId);
      setCards((prev) => prev.filter((c) => c._id !== cardId));
    } catch (err) {
      console.error("Failed to trash card:", err);
    }
  };

  // ─── Sharing ──────────────────────────────────────────────────────
  const openShareModal = async () => {
    if (!activeBoardId) return;
    setShowShareModal(true);
    setShareSearchQuery("");
    setShareSearchResults([]);
    setShareError("");
    try {
      const data = await getCollaborators(activeBoardId);
      setCollaboratorsList(data);
    } catch (err) {
      console.error("Failed to fetch collaborators:", err);
    }
  };

  const handleAddCollaborator = async (username: string) => {
    if (!activeBoardId) return;
    setShareError("");
    try {
      const newCollab = await addCollaborator(activeBoardId, username, shareRole);
      setCollaboratorsList(prev => ({
        ...prev,
        collaborators: [...prev.collaborators, newCollab],
      }));
      setShareSearchQuery("");
      setShareSearchResults([]);
    } catch (err: unknown) {
      setShareError(err instanceof Error ? err.message : "Failed to add collaborator");
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    if (!activeBoardId) return;
    try {
      await removeCollaborator(activeBoardId, userId);
      setCollaboratorsList(prev => ({
        ...prev,
        collaborators: prev.collaborators.filter(c => c.userId !== userId),
      }));
    } catch (err) {
      console.error("Failed to remove collaborator:", err);
    }
  };

  const handleChangeRole = async (userId: string, role: "editor" | "viewer") => {
    if (!activeBoardId) return;
    try {
      await updateCollaboratorRole(activeBoardId, userId, role);
      setCollaboratorsList(prev => ({
        ...prev,
        collaborators: prev.collaborators.map(c => c.userId === userId ? { ...c, role } : c),
      }));
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  // ─── Drag & drop handlers ────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, card: Card) => {
    if (!canEdit) return;
    setDraggedCard(card);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCardDragOver = (e: React.DragEvent, targetCard: Card) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isTopHalf = e.clientY < rect.top + rect.height / 2;
    setDragOverCardId(targetCard._id);
    setDragPosition(isTopHalf ? "top" : "bottom");
    setDragOverColumn(targetCard.columnId);
  };

  const handleCardDragLeave = () => {
    setDragOverCardId(null);
    setDragPosition(null);
  };

  const handleCardDrop = async (e: React.DragEvent, targetCard: Card) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverColumn(null);
    setDragOverCardId(null);
    setDragPosition(null);

    if (!draggedCard || !activeBoardId) return;
    if (draggedCard._id === targetCard._id) {
      setDraggedCard(null);
      return;
    }

    const targetColumnCards = cards
      .filter((c) => c.columnId === targetCard.columnId && c._id !== draggedCard._id)
      .sort((a, b) => a.order - b.order);

    const targetIndex = targetColumnCards.findIndex(c => c._id === targetCard._id);
    const insertIndex = dragPosition === "top" ? targetIndex : targetIndex + 1;

    const updatedDraggedCard = { ...draggedCard, columnId: targetCard.columnId };
    targetColumnCards.splice(insertIndex, 0, updatedDraggedCard);
    const finalCardsForColumn = targetColumnCards.map((c, i) => ({ ...c, order: i }));

    setCards((prev) => {
      const otherColumns = prev.filter(c => c.columnId !== targetCard.columnId && c._id !== draggedCard._id);
      return [...otherColumns, ...finalCardsForColumn];
    });

    try {
      const updates = finalCardsForColumn.map(c => ({ cardId: c._id, columnId: c.columnId, order: c.order }));
      await reorderCards(activeBoardId, updates, activeBoard?.updatedAt);
      refreshPoints();
    } catch (err: unknown) {
      console.error("Failed to reorder cards:", err);
      if (err instanceof Error && err.message?.includes("Conflict")) {
        alert("Board was modified by someone else. Refreshing...");
      }
      const data = await fetchBoardWithCards(activeBoardId);
      setActiveBoard(data.board);
      setCards(data.cards);
    }
    setDraggedCard(null);
  };

  const handleColumnDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (!dragOverCardId) {
      setDragOverColumn(columnId);
    }
  };

  const handleColumnDrop = async (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    setDragOverCardId(null);
    setDragPosition(null);

    if (!draggedCard || !activeBoardId) return;

    const targetCards = cards
      .filter((c) => c.columnId === targetColumnId && c._id !== draggedCard._id)
      .sort((a, b) => a.order - b.order);

    const updatedDraggedCard = { ...draggedCard, columnId: targetColumnId };
    targetCards.push(updatedDraggedCard);
    const finalCardsForColumn = targetCards.map((c, i) => ({ ...c, order: i }));

    setCards((prev) => {
      const otherColumns = prev.filter(c => c.columnId !== targetColumnId && c._id !== draggedCard._id);
      return [...otherColumns, ...finalCardsForColumn];
    });

    try {
      const updates = finalCardsForColumn.map(c => ({ cardId: c._id, columnId: c.columnId, order: c.order }));
      await reorderCards(activeBoardId, updates, activeBoard?.updatedAt);
      refreshPoints();
    } catch (err: unknown) {
      console.error("Failed to reorder cards:", err);
      if (err instanceof Error && err.message?.includes("Conflict")) {
        alert("Board was modified by someone else. Refreshing...");
      }
      const data = await fetchBoardWithCards(activeBoardId);
      setActiveBoard(data.board);
      setCards(data.cards);
    }
    setDraggedCard(null);
  };

  // ─── Derived ──────────────────────────────────────────────────────
  const sortedColumns = useMemo(
    () => (activeBoard ? [...activeBoard.columns].sort((a, b) => a.order - b.order) : []),
    [activeBoard]
  );

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-[calc(100vh-64px)] text-gray-500">Loading Orbit Board...</div>;
  }
  if (!isLoggedIn) return null;

  // ─── Card face helper ─────────────────────────────────────────────
  const renderCardFace = (card: Card) => {
    const checklistTotal = card.checklist?.length || 0;
    const checklistDone = card.checklist?.filter((c) => c.done).length || 0;
    const hasMeta = card.priority || card.dueDate || (card.tags && card.tags.length > 0) || checklistTotal > 0;
    const isOverdue = card.dueDate && new Date(card.dueDate) < new Date() && checklistDone < checklistTotal;

    return (
      <div className={draggedCard?._id === card._id ? "opacity-30" : "opacity-100"}>
        <div className="flex items-start gap-2">
          {card.priority && (
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_COLORS[card.priority].dot}`} title={`${card.priority} priority`} />
          )}
          <h4 className="text-sm font-medium mb-1 flex-1">{card.title || "Untitled Card"}</h4>
        </div>
        {card.content && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-1.5">{card.content}</p>
        )}
        {hasMeta && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {card.dueDate && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${isOverdue ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"}`}>
                <Calendar className="w-2.5 h-2.5" />
                {new Date(card.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
            {checklistTotal > 0 && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${checklistDone === checklistTotal ? "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"}`}>
                <CheckSquare className="w-2.5 h-2.5" />
                {checklistDone}/{checklistTotal}
              </span>
            )}
            {card.tags && card.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 truncate max-w-[80px]">
                {tag}
              </span>
            ))}
            {card.tags && card.tags.length > 2 && (
              <span className="text-[10px] text-gray-400">+{card.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSidebarBoard = (board: Board) => (
    <div key={board._id} className="relative">
      {renamingBoardId === board._id ? (
        <div className="px-4 py-1.5">
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={() => handleRenameBoard(board._id, renameValue)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameBoard(board._id, renameValue);
              if (e.key === "Escape") setRenamingBoardId(null);
            }}
            className="w-full text-xs px-2 py-1 bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
            autoFocus
          />
        </div>
      ) : (
        <div
          onClick={() => setActiveBoardId(board._id)}
          onDoubleClick={() => {
            if (board.isOwner !== false) {
              setRenamingBoardId(board._id);
              setRenameValue(board.name);
            }
          }}
          className={`w-full flex items-center justify-between px-4 py-1.5 text-[13px] transition-all cursor-pointer group ${
            activeBoardId === board._id
              ? "bg-gray-200/80 dark:bg-gray-800 text-gray-900 dark:text-white font-medium border-l-2 border-blue-500"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white border-l-2 border-transparent"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span>{board.emoji}</span>
            <span className="truncate">{board.name}</span>
          </div>
          <div className="flex items-center gap-1 transition-opacity">
            {board.isOwner !== false && (
              <button
                onClick={(e) => { e.stopPropagation(); setRenamingBoardId(board._id); setRenameValue(board.name); }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Rename"
              >
                <Pencil size={12} />
              </button>
            )}
            {board.isOwner !== false && (
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteBoardTarget(board); }}
                className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white dark:bg-[#0a0a0a] overflow-hidden">
      {/* ─── Mobile sidebar overlay backdrop (matching Notes) ─────── */}
      {sidebarOpen && (
        <div
          className="fixed top-[65px] left-0 right-0 bottom-0 z-40 bg-black/60 backdrop-blur-xl lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar (matching Notes transition pattern exactly) ───── */}
      <div
        className={`
          fixed top-[65px] bottom-0 left-0 z-50 w-64 transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:top-auto lg:bottom-auto lg:z-auto lg:translate-x-0 lg:transition-[width,min-width] lg:duration-200
          ${sidebarOpen ? "lg:w-64 lg:min-w-[256px]" : "lg:w-0 lg:min-w-0 lg:overflow-hidden"}
        `}
      >
        <div className="w-64 min-w-[256px] h-full bg-gray-50 dark:bg-[#111111] border-r border-gray-200 dark:border-gray-800 flex flex-col select-none">
          {/* ── Header ───────────────────────────────────────── */}
          <div className="px-4 min-h-[42px] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white tracking-wide uppercase">
              Boards
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNewBoardInput(true)}
                className="flex items-center gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800"
                title="New board"
              >
                <Plus size={13} />
                New
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
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
                value={boardSearchQuery}
                onChange={(e) => setBoardSearchQuery(e.target.value)}
                placeholder="Search boards..."
                className="w-full text-xs pl-7 pr-3 py-1.5 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 dark:focus:border-gray-500 focus:ring-1 focus:ring-blue-400/20 transition-colors"
              />
            </div>
          </div>

          {/* ── Top section: My Boards (~60%) ──────── */}
          <div className="flex-[6] flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto py-1.5">
              {boards
                .filter((b) => b.isOwner !== false && b.name.toLowerCase().includes(boardSearchQuery.toLowerCase()))
                .map(renderSidebarBoard)}
            </div>
          </div>

          {/* ── Bottom section: Shared (~40%) ────────────────── */}
          <div className="flex-[4] flex flex-col min-h-0 border-t border-gray-200 dark:border-gray-800">
            <div className="px-4 py-2 flex items-center gap-2 bg-gray-50 dark:bg-[#111111] flex-shrink-0">
              <Users size={13} className="text-gray-400 dark:text-gray-500" />
              <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Shared
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {!boards.some(b => b.isOwner === false) ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-[11px] text-gray-400 dark:text-gray-600 italic">
                    No shared boards
                  </p>
                </div>
              ) : (
                boards
                  .filter((b) => b.isOwner === false && b.name.toLowerCase().includes(boardSearchQuery.toLowerCase()))
                  .map(renderSidebarBoard)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            {/* Sidebar toggle — visible on all screen sizes, matching Notes */}
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
            </button>
            <button onClick={() => router.push("/dashboard")} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/5">
              <ChevronLeft className="w-5 h-5" />
            </button>
            {activeBoard && (
              <div className="flex items-center gap-2">
                <span className="text-xl">{activeBoard.emoji}</span>
                {editingHeaderName ? (
                  <input
                    type="text"
                    value={headerNameValue}
                    onChange={(e) => setHeaderNameValue(e.target.value)}
                    onBlur={handleRenameHeader}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameHeader();
                      if (e.key === "Escape") setEditingHeaderName(false);
                    }}
                    className="text-lg font-semibold bg-transparent border-b-2 border-purple-500 outline-none text-gray-900 dark:text-white"
                    autoFocus
                  />
                ) : (
                  <h1
                    className={`text-lg font-semibold ${isOwner ? "cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors" : ""}`}
                    onDoubleClick={() => {
                      if (isOwner) {
                        setEditingHeaderName(true);
                        setHeaderNameValue(activeBoard.name);
                      }
                    }}
                    title={isOwner ? "Double-click to rename" : undefined}
                  >
                    {activeBoard.name}
                  </h1>
                )}
                {!isOwner && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 capitalize">
                    {userRole}
                  </span>
                )}
                {presence.length > 1 && (
                  <div className="flex items-center ml-4">
                    <div className="flex -space-x-2">
                      {presence.slice(0, 3).map((p: {userId: string; name: string}, i: number) => (
                        <div key={i} className="w-7 h-7 rounded-full bg-blue-500 border-2 border-white dark:border-[#0a0a0b] flex items-center justify-center text-[10px] font-medium text-white" title={p.name}>
                          {p.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                      ))}
                    </div>
                    {presence.length > 3 && (
                      <span className="text-xs text-gray-500 ml-2">+{presence.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Share button */}
          <div className="flex items-center gap-2">
            {activeBoard && (
              <button
                onClick={openShareModal}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            )}
          </div>
        </div>

        {/* ─── Kanban Board ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-x-auto p-4 flex gap-4">
          {sortedColumns.map((col) => (
            <div
              key={col.columnId}
              onDragOver={(e) => canEdit ? handleColumnDragOver(e, col.columnId) : undefined}
              onDrop={(e) => canEdit ? handleColumnDrop(e, col.columnId) : undefined}
              className={`flex-shrink-0 w-80 bg-gray-50 dark:bg-[#111113] rounded-xl flex flex-col ${dragOverColumn === col.columnId && !dragOverCardId ? "ring-2 ring-black dark:ring-white" : ""}`}
            >
              <div className="p-3 flex items-center justify-between border-b border-gray-200 dark:border-white/5">
                {renamingColumnId === col.columnId ? (
                  <input
                    type="text"
                    value={columnRenameValue}
                    onChange={(e) => setColumnRenameValue(e.target.value)}
                    onBlur={() => handleRenameColumn(col.columnId, columnRenameValue)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameColumn(col.columnId, columnRenameValue);
                      if (e.key === "Escape") setRenamingColumnId(null);
                    }}
                    className="font-semibold text-sm bg-transparent border-b-2 border-purple-500 outline-none text-gray-900 dark:text-white flex-1"
                    autoFocus
                  />
                ) : (
                  <h3
                    className={`font-semibold text-sm ${canEdit ? "cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors" : ""}`}
                    onDoubleClick={() => {
                      if (canEdit) {
                        setRenamingColumnId(col.columnId);
                        setColumnRenameValue(col.name);
                      }
                    }}
                    title={canEdit ? "Double-click to rename" : undefined}
                  >
                    {col.name}
                  </h3>
                )}
                {canEdit && (
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenNewCardModal(col.columnId)} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded text-gray-500">
                      <Plus className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteColumn(col.columnId)} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded text-gray-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3">
                {cards
                  .filter((c) => c.columnId === col.columnId)
                  .sort((a, b) => a.order - b.order)
                  .map((card) => (
                    <div
                      key={card._id}
                      draggable={canEdit}
                      onDragStart={(e) => handleDragStart(e, card)}
                      onDragOver={(e) => canEdit ? handleCardDragOver(e, card) : undefined}
                      onDragLeave={handleCardDragLeave}
                      onDrop={(e) => canEdit ? handleCardDrop(e, card) : undefined}
                      onDragEnd={() => {
                        setDraggedCard(null);
                        setDragOverCardId(null);
                        setDragPosition(null);
                        setDragOverColumn(null);
                      }}
                      className={`bg-white dark:bg-[#1a1a1c] p-3 rounded-lg shadow-sm ${canEdit ? "cursor-grab active:cursor-grabbing" : ""} group relative transition-all ${
                        draggedCard?._id === card._id
                          ? "opacity-50 border-2 border-dashed border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-white/5"
                          : "opacity-100 border border-gray-200 dark:border-white/5"
                      }`}
                    >
                      {/* Drop Indicators */}
                      {dragOverCardId === card._id && dragPosition === "top" && (
                        <div className="absolute top-[-10px] left-0 right-0 h-[3px] bg-black dark:bg-white rounded-full z-10 pointer-events-none" />
                      )}
                      {dragOverCardId === card._id && dragPosition === "bottom" && (
                        <div className="absolute bottom-[-10px] left-0 right-0 h-[3px] bg-black dark:bg-white rounded-full z-10 pointer-events-none" />
                      )}

                      {renderCardFace(card)}

                      {canEdit && (
                        <button
                          onClick={() => handleDeleteCard(card._id)}
                          className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity rounded ${draggedCard?._id === card._id ? "hidden" : ""}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}

          {/* ─── Add Column trigger (always just a button, modal opens) ─── */}
          {canEdit && (
            <div className="flex-shrink-0 w-80">
              <button
                onClick={() => { setNewColumnName(""); setShowAddColumnModal(true); }}
                className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-white/20 flex items-center justify-center gap-2 text-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Column
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ─── MODALS ────────────────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      {/* ─── New Board Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showNewBoardInput && (
          <ModalShell title="New Board" onClose={() => setShowNewBoardInput(false)} footer={
            <>
              <button onClick={() => setShowNewBoardInput(false)} className={BTN_SECONDARY}>Cancel</button>
              <button onClick={handleCreateBoard} disabled={!newBoardName.trim()} className={BTN_PRIMARY}>Create</button>
            </>
          }>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Board Name</label>
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="E.g., Project Alpha"
                className={INPUT_CLASS}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreateBoard()}
              />
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* ─── Delete Board Confirmation Modal ──────────────────────────── */}
      <AnimatePresence>
        {deleteBoardTarget && (
          <ModalShell title="Delete Board" onClose={() => setDeleteBoardTarget(null)} footer={
            <>
              <button onClick={() => setDeleteBoardTarget(null)} className={BTN_SECONDARY}>Cancel</button>
              <button onClick={() => handleDeleteBoard(deleteBoardTarget._id)} className={BTN_DANGER}>
                <span className="flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Delete Board</span>
              </button>
            </>
          }>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p>Are you sure you want to delete <strong className="text-gray-900 dark:text-white">{deleteBoardTarget.emoji} {deleteBoardTarget.name}</strong>?</p>
              <p className="mt-2 text-xs text-gray-500">All cards will be moved to trash. This action cannot be undone.</p>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* ─── Add Column Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddColumnModal && (
          <ModalShell title="Add Column" onClose={() => setShowAddColumnModal(false)} footer={
            <>
              <button onClick={() => setShowAddColumnModal(false)} className={BTN_SECONDARY}>Cancel</button>
              <button onClick={handleAddColumn} disabled={!newColumnName.trim()} className={`${BTN_PRIMARY} flex items-center gap-1.5`}>
                <Plus className="w-3.5 h-3.5" /> Add Column
              </button>
            </>
          }>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Column Name</label>
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="E.g., In Progress, Review, Done"
                className={INPUT_CLASS}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddColumn();
                  if (e.key === "Escape") setShowAddColumnModal(false);
                }}
              />
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* ─── Create Card Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {showNewCardModal && (
          <ModalShell title="Create New Card" onClose={() => setShowNewCardModal(false)} maxW="max-w-md" footer={
            <>
              <button onClick={() => setShowNewCardModal(false)} className={BTN_SECONDARY}>Cancel</button>
              <button onClick={handleCreateCard} disabled={!newCardTitle.trim()} className={`${BTN_PRIMARY} flex items-center gap-1.5`}>
                <Plus className="w-3.5 h-3.5" /> Create Card
              </button>
            </>
          }>
            {/* Title (required) */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Card Title</label>
              <input
                type="text"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                placeholder="E.g., Complete UI mockups"
                className={INPUT_CLASS}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleCreateCard();
                }}
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Priority</label>
              <div className="flex gap-2">
                {(["low", "medium", "high"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setNewCardPriority(newCardPriority === level ? null : level)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      newCardPriority === level
                        ? PRIORITY_COLORS[level].pill + " border-transparent"
                        : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Due Date</label>
              <input
                type="date"
                value={newCardDueDate}
                onChange={(e) => setNewCardDueDate(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Labels / Tags</label>
              {newCardTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {newCardTags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                      {tag}
                      <button type="button" onClick={() => setNewCardTags((prev) => prev.filter((t) => t !== tag))} className="hover:text-purple-800 dark:hover:text-purple-200">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={newCardTagInput}
                onChange={(e) => setNewCardTagInput(e.target.value)}
                placeholder="Type a tag and press Enter"
                className={INPUT_CLASS}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const tag = newCardTagInput.trim();
                    if (tag && !newCardTags.includes(tag)) {
                      setNewCardTags((prev) => [...prev, tag]);
                      setNewCardTagInput("");
                    }
                  }
                }}
              />
            </div>

            {/* Checklist */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Checklist / Subtasks</label>
              {newCardChecklist.length > 0 && (
                <div className="mb-2 space-y-1">
                  {newCardChecklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                      <CheckSquare className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="flex-1">{item.text}</span>
                      <button type="button" onClick={() => setNewCardChecklist((prev) => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={newCardChecklistInput}
                onChange={(e) => setNewCardChecklistInput(e.target.value)}
                placeholder="Add a subtask and press Enter"
                className={INPUT_CLASS}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const text = newCardChecklistInput.trim();
                    if (text) {
                      setNewCardChecklist((prev) => [...prev, { text, done: false }]);
                      setNewCardChecklistInput("");
                    }
                  }
                }}
              />
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      {/* ─── Share Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showShareModal && (
          <ModalShell title="Share Board" onClose={() => setShowShareModal(false)} maxW="max-w-md" footer={null}>
            {/* Owner info */}
            {collaboratorsList.owner && (
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-medium">
                  {collaboratorsList.owner.firstName?.charAt(0).toUpperCase() || "O"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {collaboratorsList.owner.firstName} {collaboratorsList.owner.lastName}
                  </p>
                  <p className="text-[11px] text-gray-500">@{collaboratorsList.owner.username}</p>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5" /> Owner
                </span>
              </div>
            )}

            {/* Add collaborator — owner only */}
            {isOwner && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Add people</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      value={shareSearchQuery}
                      onChange={(e) => setShareSearchQuery(e.target.value)}
                      placeholder="Search by username..."
                      className={`${INPUT_CLASS} pl-9`}
                    />
                    {/* Search results dropdown */}
                    {shareSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-white/10 rounded-lg shadow-lg z-50 py-1 max-h-40 overflow-y-auto">
                        {shareSearchResults.map((u) => (
                          <button
                            key={u.userId}
                            onClick={() => handleAddCollaborator(u.username)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/5 text-left"
                          >
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-medium">
                              {u.firstName?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{u.firstName} {u.lastName}</p>
                              <p className="text-[10px] text-gray-500">@{u.username}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {shareSearching && shareSearchQuery.length >= 2 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-white/10 rounded-lg shadow-lg z-50 py-3 text-center text-xs text-gray-500">
                        Searching...
                      </div>
                    )}
                  </div>
                  <select
                    value={shareRole}
                    onChange={(e) => setShareRole(e.target.value as "editor" | "viewer")}
                    className="text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-2 text-gray-700 dark:text-gray-300 outline-none"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                {shareError && (
                  <p className="text-xs text-red-500 mt-1">{shareError}</p>
                )}
              </div>
            )}

            {/* Collaborators list */}
            {collaboratorsList.collaborators.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Collaborators ({collaboratorsList.collaborators.length})
                </label>
                <div className="space-y-2">
                  {collaboratorsList.collaborators.map((collab) => (
                    <div key={collab.userId} className="flex items-center gap-3 py-1.5">
                      <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-medium">
                        {collab.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">@{collab.username}</p>
                      </div>
                      {isOwner ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={collab.role}
                            onChange={(e) => handleChangeRole(collab.userId, e.target.value as "editor" | "viewer")}
                            className="text-[10px] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-md px-1.5 py-1 text-gray-700 dark:text-gray-300 outline-none"
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <button
                            onClick={() => handleRemoveCollaborator(collab.userId)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${collab.role === "editor" ? "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400" : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400"}`}>
                          {collab.role === "editor" ? <span className="flex items-center gap-1"><Pencil className="w-2.5 h-2.5" /> Editor</span> : <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> Viewer</span>}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {collaboratorsList.collaborators.length === 0 && !isOwner && (
              <p className="text-xs text-gray-500 text-center py-4">No other collaborators on this board.</p>
            )}
            {collaboratorsList.collaborators.length === 0 && isOwner && (
              <p className="text-xs text-gray-500 text-center py-2">Search for a user above to share this board.</p>
            )}
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
}
