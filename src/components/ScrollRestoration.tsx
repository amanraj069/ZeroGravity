"use client";

import { useEffect } from "react";

export default function ScrollRestoration() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // We want to handle scroll restoration manually to prevent jumps 
    // during hydration and state changes (like Auth loading)
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    // Save scroll position before the page is unloaded (refreshed)
    const handleBeforeUnload = () => {
      sessionStorage.setItem("zeroGravityScrollPos", window.scrollY.toString());
      sessionStorage.setItem("zeroGravityScrollPath", window.location.pathname);
    };

    // Restore scroll position after a short delay to allow content to render
    const restoreScroll = () => {
      const savedPos = sessionStorage.getItem("zeroGravityScrollPos");
      const savedPath = sessionStorage.getItem("zeroGravityScrollPath");
      
      if (savedPos && savedPath === window.location.pathname) {
        // Delay slightly to ensure hydration has finished and content height is restored
        setTimeout(() => {
          window.scrollTo({
            top: parseInt(savedPos, 10),
            behavior: "instant"
          });
        }, 100);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    
    // Initial restoration on mount
    restoreScroll();

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return null;
}
