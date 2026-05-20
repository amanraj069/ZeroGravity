"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useRouter, usePathname } from "next/navigation";

interface NavigationContextType {
  previousPage: string | null;
  navigationStack: string[];
  goBack: () => void;
  goTo: (path: string) => void;
  getBackPath: () => string;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined,
);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [navigationStack, setNavigationStack] = useState<string[]>([]);
  const [previousPage, setPreviousPage] = useState<string | null>(null);
  const isNavigatingBackRef = useRef(false);

  // Update navigation stack when pathname changes
  useEffect(() => {
    // Skip redirector pages in the navigation history
    const redirectorPages = ["/createQuiz", "/login", "/signup"];
    if (redirectorPages.includes(pathname)) return;

    // The last page in the current stack is the "previous" page before we update
    const currentLastPage = navigationStack[navigationStack.length - 1];

    if (currentLastPage && currentLastPage !== pathname) {
      setPreviousPage(currentLastPage);
    }

    setNavigationStack((prevStack) => {
      if (isNavigatingBackRef.current) {
        isNavigatingBackRef.current = false;

        const existingIndex = prevStack.indexOf(pathname);
        if (existingIndex !== -1) {
          return prevStack.slice(0, existingIndex + 1);
        }

        // If we navigated back to a logical parent that wasn't in the stack,
        // reset the stack to just that parent to prevent infinite back-loops.
        return [pathname];
      }

      // Check if pathname is already in stack (going back natively via browser)
      const existingIndex = prevStack.indexOf(pathname);
      if (existingIndex !== -1) {
        // User went back to a previous page, trim stack to that point
        return prevStack.slice(0, existingIndex + 1);
      }

      // Avoid duplicates of the same page in stack
      if (prevStack[prevStack.length - 1] === pathname) {
        return prevStack;
      }

      // New page, add to stack
      return [...prevStack, pathname];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]); // Only depend on pathname to avoid infinite loops

  // Define logical parent pages for each route
  const getLogicalParent = (path: string): string => {
    // Direct parent mappings
    if (path === "/dashboard") return "/";
    if (path === "/dashboard/academia") return "/dashboard";
    if (path?.startsWith("/dashboard/academia/")) return "/dashboard/academia";
    if (path === "/dashboard/goals") return "/dashboard";
    if (path === "/dashboard/quizzes") return "/dashboard";
    if (path === "/dashboard/quizzes/create") return "/dashboard/quizzes";
    if (path?.startsWith("/dashboard/quizzes/host/"))
      return "/dashboard/quizzes";
    if (path?.startsWith("/dashboard/quizzes/")) return "/dashboard/quizzes";
    if (path === "/dashboard/notes") return "/dashboard";
    if (path?.startsWith("/dashboard/notes/")) return "/dashboard/notes";
    if (path === "/dashboard/badges") return "/dashboard";
    if (path === "/dashboard/shop") return "/dashboard";
    if (path === "/leaderboard") return "/dashboard";
    if (path?.startsWith("/leaderboard/")) return "/dashboard/quizzes"; // From quiz detail
    if (path === "/profile") return "/dashboard";
    if (path === "/settings") return "/profile";
    if (path?.startsWith("/profile/")) return "/dashboard"; // Other users
    if (path === "/studentsHub") return "/dashboard";
    if (path?.startsWith("/studentsHub/")) return "/studentsHub";
    if (path === "/joinQuiz") return "/dashboard";
    if (path === "/createQuiz") return "/dashboard/quizzes";
    if (path?.startsWith("/hosted/")) return "/dashboard/quizzes";

    // Default fallback to dashboard
    return "/dashboard";
  };

  const getBackPath = useCallback((): string => {
    // First check if we have navigation history
    if (navigationStack.length > 1) {
      const potentialPrevious = navigationStack[navigationStack.length - 2];
      // Safety check: never return current pathname (prevents infinite loops)
      if (potentialPrevious && potentialPrevious !== pathname) {
        return potentialPrevious;
      }
    }

    // Fall back to logical parent
    const parent = getLogicalParent(pathname);
    // Safety check: if logical parent is current page, go one level higher
    if (parent === pathname) {
      return getLogicalParent(parent);
    }
    return parent;
  }, [navigationStack, pathname]);

  const goBack = useCallback(() => {
    const backPath = getBackPath();
    if (backPath && backPath !== pathname) {
      isNavigatingBackRef.current = true;
      router.push(backPath);
      // Stack will be automatically updated by useEffect when pathname changes
    }
  }, [getBackPath, router, pathname]);

  const goTo = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router],
  );

  return (
    <NavigationContext.Provider
      value={{
        previousPage,
        navigationStack,
        goBack,
        goTo,
        getBackPath,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
};
