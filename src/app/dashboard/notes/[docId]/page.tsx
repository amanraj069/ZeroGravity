"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import NotesSkeleton from "../NotesSkeleton";
import NotesApp from "../NotesApp";

export default function NoteDocPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const docId = params.docId as string;

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  if (authLoading) {
    return <NotesSkeleton isDocumentView />;
  }

  if (!isLoggedIn) {
    return <NotesSkeleton isDocumentView />;
  }

  return <NotesApp initialDocId={docId} />;
}
