import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Persists a report page's filter/search state for hard refreshes only.
 * The stored state is removed as soon as the user navigates to another route.
 */
const useReportPagePersistence = (storageKey, snapshot, restore) => {
  const location = useLocation();
  const routePathRef = useRef(location.pathname);
  const restoreRef = useRef(restore);
  const [ready, setReady] = useState(false);

  restoreRef.current = restore;

  const serializedSnapshot = useMemo(() => {
    try {
      return JSON.stringify(snapshot);
    } catch {
      return null;
    }
  }, [snapshot]);

  useEffect(() => {
    let active = true;
    const ownerPath = routePathRef.current;

    const hydrate = async () => {
      try {
        const raw = window.sessionStorage.getItem(storageKey);
        if (raw) {
          const saved = JSON.parse(raw);
          await Promise.resolve(restoreRef.current?.(saved));
        }
      } catch {
        window.sessionStorage.removeItem(storageKey);
      } finally {
        if (active) setReady(true);
      }
    };

    hydrate();

    return () => {
      active = false;
      // React StrictMode and a browser refresh keep the same pathname.
      // A real in-app navigation changes it, so only then clear the state.
      if (window.location.pathname !== ownerPath) {
        window.sessionStorage.removeItem(storageKey);
      }
    };
  }, [storageKey]);

  useEffect(() => {
    if (!ready || serializedSnapshot === null) return;

    try {
      window.sessionStorage.setItem(storageKey, serializedSnapshot);
    } catch {
      // Storage can be unavailable in private browsing or when quota is full.
    }
  }, [ready, serializedSnapshot, storageKey]);

  return ready;
};

export const parseReportDate = (value) => {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const openReportDetail = (path) => {
  if (!path) return;
  const newWindow = window.open(path, '_blank', 'noopener,noreferrer');
  if (newWindow) newWindow.opener = null;
};

export default useReportPagePersistence;
