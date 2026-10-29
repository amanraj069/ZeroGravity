import { useEffect, useRef } from "react";

// Refreshing on every tab switch would be its own burst of requests
const MIN_REFRESH_ON_RETURN_MS = 10 * 1000;

/**
 * Like setInterval, but background tabs make no requests: ticks are skipped
 * while the tab is hidden, and the callback runs once when the tab becomes
 * visible again (if it hasn't run in the last few seconds).
 *
 * Pass `null` as the delay to pause.
 */
export function useVisibleInterval(callback: () => void, delayMs: number | null) {
  const savedCallback = useRef(callback);
  const lastRunRef = useRef(0);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;

    const run = () => {
      lastRunRef.current = Date.now();
      savedCallback.current();
    };

    const tick = () => {
      if (document.visibilityState === "visible") run();
    };

    const onVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastRunRef.current >= MIN_REFRESH_ON_RETURN_MS
      ) {
        run();
      }
    };

    const id = setInterval(tick, delayMs);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [delayMs]);
}
