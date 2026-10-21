import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MEMORIES, type Memory } from "../config/content";
import { getPhotoSource, SIGNED_URL_REFRESH_INTERVAL_MS } from "../integration/photoSource";

type PhotoStatus = "placeholders" | "loading" | "connected" | "empty" | "error";

export function useMemories(): {
  memories: Memory[];
  status: PhotoStatus;
  error?: string;
  canUpload: boolean;
  refresh: () => Promise<boolean>;
  upload: (file: File, caption: string, date?: string) => Promise<void>;
  update: (path: string, caption: string, date?: string) => Promise<void>;
  download: (path: string) => Promise<Blob>;
  remove: (path: string) => Promise<void>;
} {
  const [memories, setMemories] = useState<Memory[]>(MEMORIES);
  const [status, setStatus] = useState<PhotoStatus>("placeholders");
  const [error, setError] = useState<string>();
  const active = useRef(true);
  const lastLoadedAt = useRef(0);
  const source = useMemo(() => getPhotoSource(), []);

  const refresh = useCallback(async () => {
    if (!source.configured) return true;
    setError(undefined);
    setStatus("loading");
    try {
      const list = await source.listMemories();
      if (active.current) {
        setMemories(list);
        setStatus(list.length > 0 ? "connected" : "empty");
        lastLoadedAt.current = Date.now();
      }
      return true;
    } catch (cause: unknown) {
      if (active.current) {
        setError(cause instanceof Error ? cause.message : "An unexpected error occurred.");
        setStatus("error");
      }
      return false;
    }
  }, [source]);
  const upload = useCallback(
    (file: File, caption: string, date?: string) => source.uploadMemory(file, caption, date),
    [source],
  );
  const update = useCallback(
    (path: string, caption: string, date?: string) => source.updateMemory(path, caption, date),
    [source],
  );
  const download = useCallback((path: string) => source.downloadMemory(path), [source]);
  const remove = useCallback((path: string) => source.deleteMemory(path), [source]);

  useEffect(() => {
    active.current = true;
    if (!source.configured) return;

    void refresh();
    const interval = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastLoadedAt.current >= SIGNED_URL_REFRESH_INTERVAL_MS
      ) {
        void refresh();
      }
    }, SIGNED_URL_REFRESH_INTERVAL_MS);
    const refreshWhenVisible = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastLoadedAt.current >= SIGNED_URL_REFRESH_INTERVAL_MS
      ) {
        void refresh();
      }
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      active.current = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refresh, source]);

  return { memories, status, error, canUpload: source.configured, refresh, upload, update, download, remove };
}
