// hooks/useInactivity.ts
import { useEffect, useRef, useCallback } from "react";

interface UseInactivityProps {
  timeoutMinutes?: number;
  onTimeout: () => void;
  enabled?: boolean;
}

export const useInactivity = ({
  timeoutMinutes = 30,
  onTimeout,
  enabled = true,
}: UseInactivityProps) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const resetTimeout = useCallback(() => {
    if (!enabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, timeoutMinutes * 60 * 1000);
  }, [timeoutMinutes, onTimeout, enabled]);

  useEffect(() => {
    if (!enabled) {
      // Si désactivé, nettoyer le timeout existant
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Ajouter les écouteurs d'événements
    events.forEach((event) => {
      document.addEventListener(event, resetTimeout);
    });

    // Démarrer le timeout initial
    resetTimeout();

    // Nettoyage
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, resetTimeout);
      });
    };
  }, [resetTimeout, enabled]);
};
