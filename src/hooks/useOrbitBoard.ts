import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  fetchBoards,
  fetchBoardWithCards,
  createBoard,
  updateBoard,
  deleteBoard,
  addColumn,
  updateColumn,
  deleteColumn,
  createCard,
  updateCard,
  moveCard,
  reorderCards,
  toggleCardFavorite,
  trashCard,
  deleteCard,
  getCollaborators,
  addCollaborator,
  removeCollaborator,
  updateCollaboratorRole,
  searchUsers,
  type Board,
  type Card,
  type BoardWithCards,
  type Collaborator,
  type UserSearchResult,
} from "@/services/orbitBoardService";

// Query keys factory
export const orbitBoardKeys = {
  all: ["orbitBoards"] as const,
  boards: () => [...orbitBoardKeys.all, "boards"] as const,
  board: (boardId: string) => [...orbitBoardKeys.all, "board", boardId] as const,
  cards: (boardId: string) => [...orbitBoardKeys.all, "cards", boardId] as const,
  collaborators: (boardId: string) => [...orbitBoardKeys.all, "collaborators", boardId] as const,
  userSearch: (query: string) => [...orbitBoardKeys.all, "userSearch", query] as const,
};

/**
 * Fetch all boards
 */
export function useBoards(
  options?: Omit<
    UseQueryOptions<Board[], Error, Board[], ReturnType<typeof orbitBoardKeys.boards>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: orbitBoardKeys.boards(),
    queryFn: fetchBoards,
    ...options,
  });
}

/**
 * Fetch a single board with cards
 */
export function useBoardWithCards(
  boardId: string,
  options?: Omit<
    UseQueryOptions<BoardWithCards, Error, BoardWithCards, ReturnType<typeof orbitBoardKeys.board>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: orbitBoardKeys.board(boardId),
    queryFn: () => fetchBoardWithCards(boardId),
    enabled: !!boardId,
    ...options,
  });
}

/**
 * Search users for collaboration
 */
export function useUserSearch(
  query: string,
  options?: Omit<
    UseQueryOptions<UserSearchResult[], Error, UserSearchResult[], ReturnType<typeof orbitBoardKeys.userSearch>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: orbitBoardKeys.userSearch(query),
    queryFn: () => searchUsers(query),
    enabled: query.trim().length >= 2,
    ...options,
  });
}

/**
 * Fetch collaborators for a board
 */
export function useCollaborators(
  boardId: string,
  options?: Omit<
    UseQueryOptions<{ owner: UserSearchResult | null; collaborators: Collaborator[] }, Error, { owner: UserSearchResult | null; collaborators: Collaborator[] }, ReturnType<typeof orbitBoardKeys.collaborators>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: orbitBoardKeys.collaborators(boardId),
    queryFn: () => getCollaborators(boardId),
    enabled: !!boardId,
    ...options,
  });
}

/**
 * Create a new board
 */
export function useCreateBoard(
  options?: Omit<
    UseMutationOptions<Board, Error, { name: string; emoji?: string }, { previousBoards: Board[] | undefined }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, emoji }) => createBoard(name, emoji),
    onMutate: async (newBoard) => {
      await queryClient.cancelQueries({ queryKey: orbitBoardKeys.boards() });

      const previousBoards = queryClient.getQueryData<Board[]>(orbitBoardKeys.boards());

      // Optimistically add the new board
      const tempBoard: Board = {
        _id: `temp-${Date.now()}`,
        name: newBoard.name,
        emoji: newBoard.emoji || "🚀",
        columns: [],
        viewMode: "kanban",
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Board[]>(orbitBoardKeys.boards(), (old) => {
        if (!old) return [tempBoard];
        return [...old, tempBoard];
      });

      return { previousBoards };
    },
    onError: (err, vars, context) => {
      if (context?.previousBoards) {
        queryClient.setQueryData(orbitBoardKeys.boards(), context.previousBoards);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orbitBoardKeys.boards() });
    },
    ...options,
  });
}

/**
 * Update a board
 */
export function useUpdateBoard(
  options?: Omit<
    UseMutationOptions<Board, Error, { boardId: string; updates: Partial<Pick<Board, "name" | "emoji" | "viewMode">> }, { previousBoards: Board[] | undefined; previousBoard: BoardWithCards | undefined }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, updates }) => updateBoard(boardId, updates),
    onMutate: async ({ boardId, updates }) => {
      await queryClient.cancelQueries({ queryKey: orbitBoardKeys.boards() });
      await queryClient.cancelQueries({ queryKey: orbitBoardKeys.board(boardId) });

      const previousBoards = queryClient.getQueryData<Board[]>(orbitBoardKeys.boards());
      const previousBoard = queryClient.getQueryData<BoardWithCards>(orbitBoardKeys.board(boardId));

      // Optimistic update
      queryClient.setQueryData<Board[]>(orbitBoardKeys.boards(), (old) => {
        if (!old) return old;
        return old.map((board) =>
          board._id === boardId ? { ...board, ...updates } : board
        );
      });

      queryClient.setQueryData<BoardWithCards>(orbitBoardKeys.board(boardId), (old) => {
        if (!old) return old;
        return {
          ...old,
          board: { ...old.board, ...updates } as Board,
        };
      });

      return { previousBoards, previousBoard };
    },
    onError: (err, { boardId }, context) => {
      if (context?.previousBoards) {
        queryClient.setQueryData(orbitBoardKeys.boards(), context.previousBoards);
      }
      if (context?.previousBoard) {
        queryClient.setQueryData(orbitBoardKeys.board(boardId), context.previousBoard);
      }
    },
    onSettled: (data, error, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: orbitBoardKeys.boards() });
      queryClient.invalidateQueries({ queryKey: orbitBoardKeys.board(boardId) });
    },
    ...options,
  });
}

/**
 * Delete a board
 */
export function useDeleteBoard(
  options?: Omit<
    UseMutationOptions<void, Error, string, { previousBoards: Board[] | undefined }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (boardId: string) => deleteBoard(boardId),
    onMutate: async (boardId) => {
      await queryClient.cancelQueries({ queryKey: orbitBoardKeys.boards() });

      const previousBoards = queryClient.getQueryData<Board[]>(orbitBoardKeys.boards());

      queryClient.setQueryData<Board[]>(orbitBoardKeys.boards(), (old) => {
        if (!old) return old;
        return old.filter((board) => board._id !== boardId);
      });

      return { previousBoards };
    },
    onError: (err, boardId, context) => {
      if (context?.previousBoards) {
        queryClient.setQueryData(orbitBoardKeys.boards(), context.previousBoards);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orbitBoardKeys.boards() });
    },
    ...options,
  });
}

/**
 * Add a column
 */
export function useAddColumn(
  options?: Omit<
    UseMutationOptions<Board, Error, { boardId: string; name: string }, { previousBoard: BoardWithCards | undefined }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, name }) => addColumn(boardId, name),
    onMutate: async ({ boardId }) => {
      await queryClient.cancelQueries({ queryKey: orbitBoardKeys.board(boardId) });

      const previousBoard = queryClient.getQueryData<BoardWithCards>(orbitBoardKeys.board(boardId));

      return { previousBoard };
    },
    onError: (err, { boardId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(orbitBoardKeys.board(boardId), context.previousBoard);
      }
    },
    onSettled: (data, error, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: orbitBoardKeys.board(boardId) });
    },
    ...options,
  });
}

/**
 * Update a column
 */
export function useUpdateColumn(
  options?: Omit<
    UseMutationOptions<Board, Error, { boardId: string; columnId: string; name: string }, { previousBoard: BoardWithCards | undefined }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, columnId, name }) => updateColumn(boardId, columnId, name),
    onMutate: async ({ boardId }) => {
      await queryClient.cancelQueries({ queryKey: orbitBoardKeys.board(boardId) });

      const previousBoard = queryClient.getQueryData<BoardWithCards>(orbitBoardKeys.board(boardId));

      return { previousBoard };
    },
    onError: (err, { boardId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(orbitBoardKeys.board(boardId), context.previousBoard);
      }
    },
    onSettled: (data, error, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: orbitBoardKeys.board(boardId) });
    },
    ...options,
  });
}

/**
 * Delete a column
 */
export function useDeleteColumn(
  options?: Omit<
    UseMutationOptions<Board, Error, { boardId: string; columnId: string }, { previousBoard: BoardWithCards | undefined }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, columnId }) => deleteColumn(boardId, columnId),
    onMutate: async ({ boardId }) => {
      await queryClient.cancelQueries({ queryKey: orbitBoardKeys.board(boardId) });

      const previousBoard = queryClient.getQueryData<BoardWithCards>(orbitBoardKeys.board(boardId));

      return { previousBoard };
    },
    onError: (err, { boardId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(orbitBoardKeys.board(boardId), context.previousBoard);
      }
    },
    onSettled: (data, error, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: orbitBoardKeys.board(boardId) });
    },
    ...options,
  });
}

/**
 * Create a card
 */
export function useCreateCard(
  options?: Omit<
    UseMutationOptions<Card, Error, { boardId: string; card: Partial<Card> }, { previousBoard: BoardWithCards | undefined }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, card }) => createCard(boardId, card),
    onMutate: async ({ boardId }) => {
      await queryClient.cancelQueries({ queryKey: orbitBoardKeys.board(boardId) });

      const previousBoard = queryClient.getQueryData<BoardWithCards>(orbitBoardKeys.board(boardId));

      return { previousBoard };
    },
    onError: (err, { boardId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(orbitBoardKeys.board(boardId), context.previousBoard);
      }
    },
    onSettled: (data, error, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: orbitBoardKeys.board(boardId) });
    },
    ...options,
  });
}

/**
 * Update a card
 */
export function useUpdateCard(
  options?: Omit<
    UseMutationOptions<Card, Error, { boardId: string; cardId: string; updates: Partial<Card>; boardUpdatedAt?: string }, { previousBoard: BoardWithCards | undefined }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, cardId, updates, boardUpdatedAt }) =>
      updateCard(boardId, cardId, updates, boardUpdatedAt),
    onMutate: async ({ boardId }) => {
      await queryClient.cancelQueries({ queryKey: orbitBoardKeys.board(boardId) });

      const previousBoard = queryClient.getQueryData<BoardWithCards>(orbitBoardKeys.board(boardId));

      return { previousBoard };
    },
    onError: (err, { boardId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(orbitBoardKeys.board(boardId), context.previousBoard);
      }
    },
    onSettled: (data, error, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: orbitBoardKeys.board(boardId) });
    },
    ...options,
  });
}

/**
 * Move a card (drag & drop)
 */
export function useMoveCard(
  options?: Omit<
    UseMutationOptions<Card, Error, { boardId: string; cardId: string; targetColumnId: string; targetOrder: number; boardUpdatedAt?: string }, { previousBoard: BoardWithCards | undefined }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, cardId, targetColumnId, targetOrder, boardUpdatedAt }) =>
      moveCard(boardId, cardId, targetColumnId, targetOrder, boardUpdatedAt),
    onMutate: async ({ boardId }) => {
      await queryClient.cancelQueries({ queryKey: orbitBoardKeys.board(boardId) });

      const previousBoard = queryClient.getQueryData<BoardWithCards>(orbitBoardKeys.board(boardId));

      return { previousBoard };
    },
    onError: (err, { boardId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(orbitBoardKeys.board(boardId), context.previousBoard);
      }
    },
    onSettled: (data, error, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: orbitBoardKeys.board(boardId) });
    },
    ...options,
  });
}

/**
 * Reorder cards
 */
export function useReorderCards(
  options?: Omit<
    UseMutationOptions<void, Error, { boardId: string; updates: { cardId: string; columnId: string; order: number }[]; boardUpdatedAt?: string }, { previousBoard: BoardWithCards | undefined }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, updates, boardUpdatedAt }) =>
      reorderCards(boardId, updates, boardUpdatedAt),
    onMutate: async ({ boardId }) => {
      await queryClient.cancelQueries({ queryKey: orbitBoardKeys.board(boardId) });

      const previousBoard = queryClient.getQueryData<BoardWithCards>(orbitBoardKeys.board(boardId));

      return { previousBoard };
    },
    onError: (err, { boardId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(orbitBoardKeys.board(boardId), context.previousBoard);
      }
    },
    onSettled: (data, error, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: orbitBoardKeys.board(boardId) });
    },
    ...options,
  });
}

/**
 * Toggle card favorite
 */
export function useToggleCardFavorite(
  options?: Omit<
    UseMutationOptions<Card, Error, { boardId: string; cardId: string }, { previousBoard: BoardWithCards | undefined }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, cardId }) => toggleCardFavorite(boardId, cardId),
    onMutate: async ({ boardId }) => {
      await queryClient.cancelQueries({ queryKey: orbitBoardKeys.board(boardId) });

      const previousBoard = queryClient.getQueryData<BoardWithCards>(orbitBoardKeys.board(boardId));

      return { previousBoard };
    },
    onError: (err, { boardId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(orbitBoardKeys.board(boardId), context.previousBoard);
      }
    },
    onSettled: (data, error, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: orbitBoardKeys.board(boardId) });
    },
    ...options,
  });
}

/**
 * Trash a card
 */
export function useTrashCard(
  options?: Omit<
    UseMutationOptions<void, Error, { boardId: string; cardId: string }, { previousBoard: BoardWithCards | undefined }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, cardId }) => trashCard(boardId, cardId),
    onMutate: async ({ boardId }) => {
      await queryClient.cancelQueries({ queryKey: orbitBoardKeys.board(boardId) });

      const previousBoard = queryClient.getQueryData<BoardWithCards>(orbitBoardKeys.board(boardId));

      return { previousBoard };
    },
    onError: (err, { boardId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(orbitBoardKeys.board(boardId), context.previousBoard);
      }
    },
    onSettled: (data, error, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: orbitBoardKeys.board(boardId) });
    },
    ...options,
  });
}

/**
 * Delete a card permanently
 */
export function useDeleteCard(
  options?: Omit<
    UseMutationOptions<void, Error, { boardId: string; cardId: string }, { previousBoard: BoardWithCards | undefined }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, cardId }) => deleteCard(boardId, cardId),
    onMutate: async ({ boardId }) => {
      await queryClient.cancelQueries({ queryKey: orbitBoardKeys.board(boardId) });

      const previousBoard = queryClient.getQueryData<BoardWithCards>(orbitBoardKeys.board(boardId));

      return { previousBoard };
    },
    onError: (err, { boardId }, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(orbitBoardKeys.board(boardId), context.previousBoard);
      }
    },
    onSettled: (data, error, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: orbitBoardKeys.board(boardId) });
    },
    ...options,
  });
}

/**
 * Add a collaborator
 */
export function useAddCollaborator(
  options?: Omit<
    UseMutationOptions<Collaborator, Error, { boardId: string; username: string; role: "editor" | "viewer" }, { previousCollaborators: { owner: UserSearchResult | null; collaborators: Collaborator[] } | undefined }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, username, role }) => addCollaborator(boardId, username, role),
    onMutate: async ({ boardId }) => {
      await queryClient.cancelQueries({ queryKey: orbitBoardKeys.collaborators(boardId) });

      const previousCollaborators = queryClient.getQueryData<{ owner: UserSearchResult | null; collaborators: Collaborator[] }>(orbitBoardKeys.collaborators(boardId));

      return { previousCollaborators };
    },
    onError: (err, { boardId }, context) => {
      if (context?.previousCollaborators) {
        queryClient.setQueryData(orbitBoardKeys.collaborators(boardId), context.previousCollaborators);
      }
    },
    onSettled: (data, error, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: orbitBoardKeys.collaborators(boardId) });
    },
    ...options,
  });
}

/**
 * Remove a collaborator
 */
export function useRemoveCollaborator(
  options?: Omit<
    UseMutationOptions<void, Error, { boardId: string; userId: string }, { previousCollaborators: { owner: UserSearchResult | null; collaborators: Collaborator[] } | undefined }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, userId }) => removeCollaborator(boardId, userId),
    onMutate: async ({ boardId }) => {
      await queryClient.cancelQueries({ queryKey: orbitBoardKeys.collaborators(boardId) });

      const previousCollaborators = queryClient.getQueryData<{ owner: UserSearchResult | null; collaborators: Collaborator[] }>(orbitBoardKeys.collaborators(boardId));

      return { previousCollaborators };
    },
    onError: (err, { boardId }, context) => {
      if (context?.previousCollaborators) {
        queryClient.setQueryData(orbitBoardKeys.collaborators(boardId), context.previousCollaborators);
      }
    },
    onSettled: (data, error, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: orbitBoardKeys.collaborators(boardId) });
    },
    ...options,
  });
}

/**
 * Update collaborator role
 */
export function useUpdateCollaboratorRole(
  options?: Omit<
    UseMutationOptions<void, Error, { boardId: string; userId: string; role: "editor" | "viewer" }, { previousCollaborators: { owner: UserSearchResult | null; collaborators: Collaborator[] } | undefined }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, userId, role }) => updateCollaboratorRole(boardId, userId, role),
    onMutate: async ({ boardId }) => {
      await queryClient.cancelQueries({ queryKey: orbitBoardKeys.collaborators(boardId) });

      const previousCollaborators = queryClient.getQueryData<{ owner: UserSearchResult | null; collaborators: Collaborator[] }>(orbitBoardKeys.collaborators(boardId));

      return { previousCollaborators };
    },
    onError: (err, { boardId }, context) => {
      if (context?.previousCollaborators) {
        queryClient.setQueryData(orbitBoardKeys.collaborators(boardId), context.previousCollaborators);
      }
    },
    onSettled: (data, error, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: orbitBoardKeys.collaborators(boardId) });
    },
    ...options,
  });
}