"use client";

// クライアント側の状態管理。
// 起動時に /api/pm/state を1回読み込み、以降は楽観的更新 + API 同期で運用する。

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Collection, PmState } from "@/lib/pm/types";

interface Ctx {
  state: PmState | null;
  loading: boolean;
  error: string;
  toast: string;
  showToast: (msg: string) => void;
  create: (collection: Collection, item: Record<string, unknown>) => Promise<void>;
  update: (collection: Collection, id: string, patch: Record<string, unknown>) => Promise<void>;
  remove: (collection: Collection, id: string) => Promise<void>;
  reload: () => Promise<void>;
  patchLocal: (fn: (s: PmState) => PmState) => void;
}

const PmContext = createContext<Ctx | null>(null);

export function PmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PmState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  }, []);

  const reload = useCallback(async () => {
    try {
      const res = await fetch("/api/pm/state", { cache: "no-store" });
      if (!res.ok) throw new Error(`読み込みに失敗しました (${res.status})`);
      setState(await res.json());
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const patchLocal = useCallback((fn: (s: PmState) => PmState) => {
    setState((prev) => (prev ? fn(structuredClone(prev)) : prev));
  }, []);

  const create = useCallback(
    async (collection: Collection, item: Record<string, unknown>) => {
      const res = await fetch(`/api/pm/${collection}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) {
        showToast("追加に失敗しました");
        return;
      }
      const created = await res.json();
      setState((prev) => {
        if (!prev) return prev;
        const next = structuredClone(prev);
        (next[collection] as unknown[]).unshift(created);
        return next;
      });
      showToast("追加しました");
    },
    [showToast],
  );

  const update = useCallback(
    async (collection: Collection, id: string, patch: Record<string, unknown>) => {
      // 楽観的更新（入力のたびに待たせない）
      setState((prev) => {
        if (!prev) return prev;
        const next = structuredClone(prev);
        const list = next[collection] as unknown as { id: string }[];
        const idx = list.findIndex((x) => x.id === id);
        if (idx !== -1) list[idx] = { ...list[idx], ...patch };
        return next;
      });
      const res = await fetch(`/api/pm/${collection}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        showToast("保存に失敗しました");
        await reload();
      }
    },
    [reload, showToast],
  );

  const remove = useCallback(
    async (collection: Collection, id: string) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = structuredClone(prev);
        const list = next[collection] as unknown as { id: string }[];
        const idx = list.findIndex((x) => x.id === id);
        if (idx !== -1) list.splice(idx, 1);
        return next;
      });
      const res = await fetch(`/api/pm/${collection}/${id}`, { method: "DELETE" });
      if (!res.ok) {
        showToast("削除に失敗しました");
        await reload();
      } else {
        showToast("削除しました");
      }
    },
    [reload, showToast],
  );

  const value = useMemo<Ctx>(
    () => ({ state, loading, error, toast, showToast, create, update, remove, reload, patchLocal }),
    [state, loading, error, toast, showToast, create, update, remove, reload, patchLocal],
  );

  return <PmContext.Provider value={value}>{children}</PmContext.Provider>;
}

export function usePm(): Ctx {
  const ctx = useContext(PmContext);
  if (!ctx) throw new Error("usePm は PmProvider の内側で使ってください");
  return ctx;
}

/** state が読み込まれている前提で使うショートカット */
export function usePmState(): PmState {
  const { state } = usePm();
  if (!state) throw new Error("state 未読み込み");
  return state;
}
