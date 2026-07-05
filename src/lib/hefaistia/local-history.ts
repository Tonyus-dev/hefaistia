// Histórico local leve das interações do console. Vive só em localStorage —
// sem IndexedDB, sem token, sem chave OpenRouter, sem anexos.

import { HEFAISTIA_STORAGE_KEYS } from "./config";

export type HefaistiaHistoryMode =
  | "klio-local"
  | "kaline-fallback"
  | "route-task"
  | "benchmark"
  | "daily-export";

export interface HefaistiaHistoryItem {
  id: string;
  created_at: string;
  mode: HefaistiaHistoryMode;
  title: string;
  input?: string;
  result?: string;
  metadata?: Record<string, unknown>;
}

const MAX_ITEMS = 30;

function safeParse(raw: string | null): HefaistiaHistoryItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HefaistiaHistoryItem[]) : [];
  } catch {
    return [];
  }
}

export function getHistory(): HefaistiaHistoryItem[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(HEFAISTIA_STORAGE_KEYS.history));
}

export function addHistoryItem(
  item: Omit<HefaistiaHistoryItem, "id" | "created_at">,
): HefaistiaHistoryItem[] {
  if (typeof window === "undefined") return [];

  const entry: HefaistiaHistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  };

  const next = [entry, ...getHistory()].slice(0, MAX_ITEMS);
  window.localStorage.setItem(HEFAISTIA_STORAGE_KEYS.history, JSON.stringify(next));
  return next;
}

export function clearHistory(): HefaistiaHistoryItem[] {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(HEFAISTIA_STORAGE_KEYS.history);
  }
  return [];
}
