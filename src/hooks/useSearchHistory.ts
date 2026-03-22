import { useState, useCallback } from 'react';

const STORAGE_KEY = 'vocab_search_history';
const MAX_ITEMS = 15;

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {}
}

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(loadHistory);

  const addToHistory = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const deduped = [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, MAX_ITEMS);
      saveHistory(deduped);
      return deduped;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  return { history, addToHistory, clearHistory };
}
