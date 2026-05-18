import { API_ENDPOINTS, apiCallWithAuth } from "@/config/api";

export interface Note {
  _id: string;
  title: string;
  content: string;
  category: string | null;
  favorite: boolean;
  trash: boolean;
  lastUpdatedDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteCategory {
  _id: string;
  name: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotesQuery {
  trash?: boolean;
  favorite?: boolean;
  category?: string;
  search?: string;
}

// ─── Notes ───────────────────────────────────────────────────

export async function fetchNotes(query: NotesQuery = {}): Promise<Note[]> {
  const params = new URLSearchParams();
  if (query.trash) params.set("trash", "true");
  if (query.favorite) params.set("favorite", "true");
  if (query.category) params.set("category", query.category);
  if (query.search) params.set("search", query.search);

  const url = `${API_ENDPOINTS.NOTES.LIST}${params.toString() ? `?${params}` : ""}`;
  const res = await apiCallWithAuth(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function fetchNote(id: string): Promise<Note> {
  const res = await apiCallWithAuth(API_ENDPOINTS.NOTES.GET(id));
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function createNote(body: Partial<Note>): Promise<Note> {
  const res = await apiCallWithAuth(API_ENDPOINTS.NOTES.CREATE, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function updateNote(
  id: string,
  body: Partial<Note>,
): Promise<Note> {
  const res = await apiCallWithAuth(API_ENDPOINTS.NOTES.UPDATE(id), {
    method: "PUT",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function trashNote(id: string): Promise<Note> {
  const res = await apiCallWithAuth(API_ENDPOINTS.NOTES.TRASH(id), {
    method: "PATCH",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function restoreNote(id: string): Promise<Note> {
  const res = await apiCallWithAuth(API_ENDPOINTS.NOTES.RESTORE(id), {
    method: "PATCH",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function toggleFavorite(id: string): Promise<Note> {
  const res = await apiCallWithAuth(API_ENDPOINTS.NOTES.FAVORITE(id), {
    method: "PATCH",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function deleteNote(id: string): Promise<void> {
  const res = await apiCallWithAuth(API_ENDPOINTS.NOTES.DELETE(id), {
    method: "DELETE",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
}

export async function emptyTrash(): Promise<number> {
  const res = await apiCallWithAuth(API_ENDPOINTS.NOTES.EMPTY_TRASH, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.deletedCount;
}

// ─── Categories ──────────────────────────────────────────────

export async function fetchCategories(): Promise<NoteCategory[]> {
  const res = await apiCallWithAuth(API_ENDPOINTS.NOTES.CATEGORIES);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function createCategory(name: string): Promise<NoteCategory> {
  const res = await apiCallWithAuth(API_ENDPOINTS.NOTES.CATEGORIES, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function updateCategory(
  id: string,
  name: string,
): Promise<NoteCategory> {
  const res = await apiCallWithAuth(API_ENDPOINTS.NOTES.UPDATE_CATEGORY(id), {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await apiCallWithAuth(API_ENDPOINTS.NOTES.DELETE_CATEGORY(id), {
    method: "DELETE",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
}

export async function togglePinCategory(id: string): Promise<NoteCategory> {
  const res = await apiCallWithAuth(API_ENDPOINTS.NOTES.PIN_CATEGORY(id), {
    method: "PATCH",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

// ─── Image Upload ────────────────────────────────────────────────

export async function uploadNoteImage(
  file: File,
): Promise<{ url: string; width: number; height: number }> {
  const formData = new FormData();
  formData.append("image", file);

  // We need to NOT set Content-Type header so the browser sets it with the boundary
  const res = await apiCallWithAuth(API_ENDPOINTS.NOTES.UPLOAD_IMAGE, {
    method: "POST",
    body: formData,
    headers: {
      // Override default JSON content-type — let browser set multipart boundary
      "Content-Type": "",
    },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}
