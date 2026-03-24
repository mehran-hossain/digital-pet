import { useState, useRef, useCallback } from "react";

export function useAnimation(durationMs) {
  const [isActive, setIsActive] = useState(false);
  const timeoutRef = useRef(null);

  const trigger = useCallback(() => {
    setIsActive(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsActive(false);
      timeoutRef.current = null;
    }, durationMs);
  }, [durationMs]);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return { isActive, trigger, cleanup, ref: timeoutRef };
}
