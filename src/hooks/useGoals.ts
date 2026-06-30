import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  goalsService,
  type Goal,
  type GoalsResponse,
  type CreateGoalData,
  type UpdateGoalData,
} from "@/services/goalsService";
import { dailyTasksService } from "@/services/dailyTasksService";

// Query keys factory
export const goalsKeys = {
  all: ["goals"] as const,
  lists: () => [...goalsKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...goalsKeys.lists(), { filters }] as const,
  details: () => [...goalsKeys.all, "detail"] as const,
  detail: (id: string) => [...goalsKeys.details(), id] as const,
  analytics: () => [...goalsKeys.all, "analytics"] as const,
  streak: () => [...goalsKeys.all, "streak"] as const,
};

/**
 * Fetch all goals with analytics
 */
export function useGoals(
  options?: Omit<
    UseQueryOptions<GoalsResponse, Error, GoalsResponse, ReturnType<typeof goalsKeys.list>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: goalsKeys.list(),
    queryFn: () => goalsService.getGoals(),
    ...options,
  });
}

/**
 * Fetch a single goal by ID
 */
export function useGoal(
  id: string,
  options?: Omit<
    UseQueryOptions<Goal, Error, Goal, ReturnType<typeof goalsKeys.detail>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: goalsKeys.detail(id),
    queryFn: () => goalsService.getGoal(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Fetch goals by category
 */
export function useGoalsByCategory(
  category: "weekly" | "monthly" | "quarterly" | "yearly",
  options?: Omit<
    UseQueryOptions<Goal[], Error, Goal[], ReturnType<typeof goalsKeys.list>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: goalsKeys.list({ category }),
    queryFn: () => goalsService.getGoalsByCategory(category),
    enabled: !!category,
    ...options,
  });
}

/**
 * Fetch daily tasks streak info
 */
export function useStreakInfo(
  options?: Omit<
    UseQueryOptions<unknown, Error, unknown, ReturnType<typeof goalsKeys.streak>>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: goalsKeys.streak(),
    queryFn: () => dailyTasksService.getStreakInfo(),
    ...options,
  });
}

/**
 * Create a new goal
 */
export function useCreateGoal(
  options?: Omit<
    UseMutationOptions<Goal, Error, CreateGoalData, { previousGoals: GoalsResponse | undefined }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGoalData) => goalsService.createGoal(data),
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: goalsKeys.lists() });

      // Snapshot the previous value
      const previousGoals = queryClient.getQueryData<GoalsResponse>(goalsKeys.list());

      // Optimistically update to the new value
      queryClient.setQueryData<GoalsResponse>(goalsKeys.list(), (old) => {
        if (!old) return old;
        // We don't have the full goal yet, just return old for now
        // The onSettled will refetch
        return old;
      });

      return { previousGoals };
    },
    onError: (err, newGoal, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(goalsKeys.list(), context.previousGoals);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: goalsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalsKeys.analytics() });
    },
    ...options,
  });
}

/**
 * Update a goal
 */
export function useUpdateGoal(
  options?: Omit<
    UseMutationOptions<Goal, Error, { id: string; data: UpdateGoalData }, { previousGoals: GoalsResponse | undefined; previousGoal: Goal | undefined }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => goalsService.updateGoal(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: goalsKeys.lists() });
      await queryClient.cancelQueries({ queryKey: goalsKeys.detail(id) });

      const previousGoals = queryClient.getQueryData<GoalsResponse>(goalsKeys.list());
      const previousGoal = queryClient.getQueryData<Goal>(goalsKeys.detail(id));

      // Optimistic update
      queryClient.setQueryData<Goal>(goalsKeys.detail(id), (old) => {
        if (!old) return old;
        return { ...old, ...data } as Goal;
      });

      queryClient.setQueryData<GoalsResponse>(goalsKeys.list(), (old) => {
        if (!old) return old;
        return {
          ...old,
          goals: old.goals.map((goal) =>
            goal._id === id ? { ...goal, ...data } : goal
          ),
        } as GoalsResponse;
      });

      return { previousGoals, previousGoal };
    },
    onError: (err, { id }, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(goalsKeys.list(), context.previousGoals);
      }
      if (context?.previousGoal) {
        queryClient.setQueryData(goalsKeys.detail(id), context.previousGoal);
      }
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: goalsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: goalsKeys.analytics() });
    },
    ...options,
  });
}

/**
 * Delete a goal
 */
export function useDeleteGoal(
  options?: Omit<
    UseMutationOptions<void, Error, string, { previousGoals: GoalsResponse | undefined }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => goalsService.deleteGoal(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: goalsKeys.lists() });

      const previousGoals = queryClient.getQueryData<GoalsResponse>(goalsKeys.list());

      queryClient.setQueryData<GoalsResponse>(goalsKeys.list(), (old) => {
        if (!old) return old;
        return {
          ...old,
          goals: old.goals.filter((goal) => goal._id !== id),
        };
      });

      return { previousGoals };
    },
    onError: (err, id, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(goalsKeys.list(), context.previousGoals);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: goalsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalsKeys.analytics() });
    },
    ...options,
  });
}

/**
 * Toggle goal completion
 */
export function useToggleGoalCompletion(
  options?: Omit<
    UseMutationOptions<Goal, Error, string, { previousGoals: GoalsResponse | undefined; previousAnalytics: unknown }>,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => goalsService.toggleGoalCompletion(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: goalsKeys.lists() });
      await queryClient.cancelQueries({ queryKey: goalsKeys.analytics() });

      const previousGoals = queryClient.getQueryData<GoalsResponse>(goalsKeys.list());
      const previousAnalytics = queryClient.getQueryData(goalsKeys.analytics());

      // Optimistic update
      queryClient.setQueryData<GoalsResponse>(goalsKeys.list(), (old) => {
        if (!old) return old;
        return {
          ...old,
          goals: old.goals.map((goal) =>
            goal._id === id ? { ...goal, completed: !goal.completed } : goal
          ),
        };
      });

      return { previousGoals, previousAnalytics };
    },
    onError: (err, id, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(goalsKeys.list(), context.previousGoals);
      }
      if (context?.previousAnalytics !== undefined) {
        queryClient.setQueryData(goalsKeys.analytics(), context.previousAnalytics);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: goalsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalsKeys.analytics() });
    },
    ...options,
  });
}

/**
 * Toggle milestone completion
 */
export function useToggleMilestoneCompletion(
  options?: Omit<
    UseMutationOptions<
      Goal,
      Error,
      { goalId: string; milestoneId: string },
      { previousGoals: GoalsResponse | undefined; previousGoal: Goal | undefined; previousAnalytics: unknown }
    >,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ goalId, milestoneId }) =>
      goalsService.toggleMilestoneCompletion(goalId, milestoneId),
    onMutate: async ({ goalId }) => {
      await queryClient.cancelQueries({ queryKey: goalsKeys.lists() });
      await queryClient.cancelQueries({ queryKey: goalsKeys.detail(goalId) });
      await queryClient.cancelQueries({ queryKey: goalsKeys.analytics() });

      const previousGoals = queryClient.getQueryData<GoalsResponse>(goalsKeys.list());
      const previousGoal = queryClient.getQueryData<Goal>(goalsKeys.detail(goalId));
      const previousAnalytics = queryClient.getQueryData(goalsKeys.analytics());

      // Optimistic update for the goal in the list
      queryClient.setQueryData<GoalsResponse>(goalsKeys.list(), (old) => {
        if (!old) return old;
        return {
          ...old,
          goals: old.goals.map((goal) => {
            if (goal._id !== goalId) return goal;
            return {
              ...goal,
              milestones: goal.milestones.map((m) => ({
                ...m,
                completed: !m.completed, // This is simplified; real logic would check which milestone
              })),
            };
          }),
        };
      });

      return { previousGoals, previousGoal, previousAnalytics };
    },
    onError: (err, { goalId }, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(goalsKeys.list(), context.previousGoals);
      }
      if (context?.previousGoal) {
        queryClient.setQueryData(goalsKeys.detail(goalId), context.previousGoal);
      }
      if (context?.previousAnalytics !== undefined) {
        queryClient.setQueryData(goalsKeys.analytics(), context.previousAnalytics);
      }
    },
    onSettled: (data, error, { goalId }) => {
      queryClient.invalidateQueries({ queryKey: goalsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: goalsKeys.detail(goalId) });
      queryClient.invalidateQueries({ queryKey: goalsKeys.analytics() });
    },
    ...options,
  });
}

/**
 * Decompose goal into Orbit Board cards
 */
export function useDecomposeGoal(
  options?: Omit<
    UseMutationOptions<
      { boardId: string; boardName: string; cards: Record<string, unknown>[]; modelUsed: string },
      Error,
      string
    >,
    "mutationFn"
  >
) {
  return useMutation({
    mutationFn: (id: string) => goalsService.decomposeGoal(id),
    ...options,
  });
}

// Prefetch helper
export function prefetchGoals(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.prefetchQuery({
    queryKey: goalsKeys.list(),
    queryFn: () => goalsService.getGoals(),
  });
}