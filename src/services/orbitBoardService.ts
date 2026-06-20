import { API_ENDPOINTS, apiCallWithAuth } from "@/config/api";

// ─── Types ───────────────────────────────────────────────────────────

export interface BoardColumn {
  columnId: string;
  name: string;
  order: number;
}

export interface Collaborator {
  userId: string;
  username: string;
  role: "editor" | "viewer";
  addedAt: string;
}

export interface UserSearchResult {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  profilePicture: string | null;
}

export interface Board {
  _id: string;
  name: string;
  emoji: string;
  columns: BoardColumn[];
  viewMode: "kanban" | "grid";
  isDefault: boolean;
  isOwner?: boolean;
  collaborators?: Collaborator[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  text: string;
  done: boolean;
}

export interface Card {
  _id: string;
  title: string;
  content: string;
  boardId: string;
  columnId: string;
  cardType: "note" | "link" | "checklist" | "code";
  color: string | null;
  tags: string[];
  isPinned: boolean;
  order: number;
  favorite: boolean;
  trash: boolean;
  linkUrl: string | null;
  checklist?: ChecklistItem[];
  codeLanguage: string | null;
  priority?: "low" | "medium" | "high" | null;
  dueDate?: string | null;
  assignee?: string | null;
  lastUpdatedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardWithCards {
  board: Board;
  cards: Card[];
  isOwner: boolean;
  userRole: "owner" | "editor" | "viewer";
}

// ─── Board API ───────────────────────────────────────────────────────

export async function fetchBoards(): Promise<Board[]> {
  const res = await apiCallWithAuth(API_ENDPOINTS.ORBIT_BOARDS.LIST);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function fetchBoardWithCards(
  boardId: string
): Promise<BoardWithCards> {
  const res = await apiCallWithAuth(API_ENDPOINTS.ORBIT_BOARDS.GET(boardId));
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function createBoard(
  name: string,
  emoji?: string
): Promise<Board> {
  const res = await apiCallWithAuth(API_ENDPOINTS.ORBIT_BOARDS.CREATE, {
    method: "POST",
    body: JSON.stringify({ name, emoji }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function updateBoard(
  boardId: string,
  updates: Partial<Pick<Board, "name" | "emoji" | "viewMode">>
): Promise<Board> {
  const res = await apiCallWithAuth(API_ENDPOINTS.ORBIT_BOARDS.UPDATE(boardId), {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function deleteBoard(boardId: string): Promise<void> {
  const res = await apiCallWithAuth(API_ENDPOINTS.ORBIT_BOARDS.DELETE(boardId), {
    method: "DELETE",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
}

// ─── Column API ──────────────────────────────────────────────────────

export async function addColumn(
  boardId: string,
  name: string
): Promise<Board> {
  const res = await apiCallWithAuth(API_ENDPOINTS.ORBIT_BOARDS.ADD_COLUMN(boardId), {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function updateColumn(
  boardId: string,
  columnId: string,
  name: string
): Promise<Board> {
  const res = await apiCallWithAuth(
    API_ENDPOINTS.ORBIT_BOARDS.UPDATE_COLUMN(boardId, columnId),
    {
      method: "PUT",
      body: JSON.stringify({ name }),
    }
  );
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function deleteColumn(
  boardId: string,
  columnId: string
): Promise<Board> {
  const res = await apiCallWithAuth(
    API_ENDPOINTS.ORBIT_BOARDS.DELETE_COLUMN(boardId, columnId),
    { method: "DELETE" }
  );
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

// ─── Card API ────────────────────────────────────────────────────────

export async function createCard(
  boardId: string,
  card: Partial<Card>
): Promise<Card> {
  const res = await apiCallWithAuth(
    API_ENDPOINTS.ORBIT_BOARDS.CREATE_CARD(boardId),
    {
      method: "POST",
      body: JSON.stringify(card),
    }
  );
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function updateCard(
  boardId: string,
  cardId: string,
  updates: Partial<Card>,
  boardUpdatedAt?: string
): Promise<Card> {
  const res = await apiCallWithAuth(API_ENDPOINTS.ORBIT_BOARDS.UPDATE_CARD(boardId, cardId), {
    method: "PUT",
    body: JSON.stringify({ ...updates, boardUpdatedAt }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function moveCard(
  boardId: string,
  cardId: string,
  targetColumnId: string,
  targetOrder: number,
  boardUpdatedAt?: string
): Promise<Card> {
  const res = await apiCallWithAuth(API_ENDPOINTS.ORBIT_BOARDS.MOVE_CARD(boardId, cardId), {
    method: "PUT",
    body: JSON.stringify({ targetColumnId, targetOrder, boardUpdatedAt }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function reorderCards(
  boardId: string,
  updates: { cardId: string; columnId: string; order: number }[],
  boardUpdatedAt?: string
): Promise<void> {
  const res = await apiCallWithAuth(
    API_ENDPOINTS.ORBIT_BOARDS.REORDER_CARDS(boardId),
    {
      method: "PUT",
      body: JSON.stringify({ updates, boardUpdatedAt }),
    }
  );
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
}

export async function toggleCardFavorite(boardId: string, cardId: string): Promise<Card> {
  const res = await apiCallWithAuth(API_ENDPOINTS.ORBIT_BOARDS.FAVORITE_CARD(boardId, cardId), {
    method: "PATCH",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function trashCard(boardId: string, cardId: string): Promise<void> {
  const res = await apiCallWithAuth(API_ENDPOINTS.ORBIT_BOARDS.TRASH_CARD(boardId, cardId), {
    method: "PATCH",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
}

export async function deleteCard(boardId: string, cardId: string): Promise<void> {
  const res = await apiCallWithAuth(API_ENDPOINTS.ORBIT_BOARDS.DELETE_CARD(boardId, cardId), {
    method: "DELETE",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
}

// ─── Collaborator API ────────────────────────────────────────────────

export async function getCollaborators(boardId: string): Promise<{ owner: UserSearchResult | null; collaborators: Collaborator[] }> {
  const res = await apiCallWithAuth(API_ENDPOINTS.ORBIT_BOARDS.COLLABORATORS(boardId));
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function addCollaborator(boardId: string, username: string, role: "editor" | "viewer" = "editor"): Promise<Collaborator> {
  const res = await apiCallWithAuth(API_ENDPOINTS.ORBIT_BOARDS.COLLABORATORS(boardId), {
    method: "POST",
    body: JSON.stringify({ username, role }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function removeCollaborator(boardId: string, userId: string): Promise<void> {
  const res = await apiCallWithAuth(API_ENDPOINTS.ORBIT_BOARDS.COLLABORATOR(boardId, userId), {
    method: "DELETE",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
}

export async function updateCollaboratorRole(boardId: string, userId: string, role: "editor" | "viewer"): Promise<void> {
  const res = await apiCallWithAuth(API_ENDPOINTS.ORBIT_BOARDS.COLLABORATOR(boardId, userId), {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
}

// ─── User Search API ─────────────────────────────────────────────────

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const res = await apiCallWithAuth(`${API_ENDPOINTS.SEARCH_USERS}?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

