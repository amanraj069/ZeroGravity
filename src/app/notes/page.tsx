"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
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
    return (
      <ZeroGravityLoading
        title="Loading Notes"
        subtitle="Preparing your workspace..."
        showNavigation={false}
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <ZeroGravityLoading
        title="Redirecting"
        subtitle="Redirecting to login..."
        showNavigation={false}
      />
    );
  }

  return <NotesApp />;
}

export default function NotesPage() {
  return (
    <Suspense
      fallback={
        <ZeroGravityLoading
          title="Loading Notes"
          subtitle="Preparing your workspace..."
          showNavigation={false}
        />
      }
    >
      <NotesPageInner />
    </Suspense>
  );
}
