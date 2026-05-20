"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import NotesSkeleton from "./NotesSkeleton";
import NotesApp from "./NotesApp";

function NotesPageInner() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  if (authLoading) {
    return <NotesSkeleton />;
  }

  if (!isLoggedIn) {
    return <NotesSkeleton />;
  }

  return <NotesApp />;
}

export default function NotesPage() {
  return (
    <Suspense fallback={<NotesSkeleton />}>
      <NotesPageInner />
    </Suspense>
  );
}
