import { db } from '../db';
import { supabaseWordAdapter } from '../supabase/wordAdapter';
import { useAuthStore } from '@/stores/authStore';
import type { Word } from '@/types';

// ── Dexie (local) adapter ──────────────────────────────────────────────────

const dexieWordAdapter = {
  async addWord(
    word: Omit<Word, 'id' | 'dateAdded' | 'difficulty' | 'easeFactor' | 'interval' | 'repetitions' | 'nextReviewDate' | 'lastReviewed' | 'reviewCount' | 'correctCount' | 'incorrectCount' | 'status'>
  ): Promise<Word> {
    const id = crypto.randomUUID();
    const now = new Date();

    const newWord: Word = {
      ...word,
      id,
      dateAdded: now,
      difficulty: 3,
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReviewDate: now,
      lastReviewed: null,
      reviewCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      status: 'learning',
    };

    await db.words.add(newWord);
    return newWord;
  },

  async getWord(id: string): Promise<Word | undefined> {
    return db.words.get(id);
  },

  async getAllWords(): Promise<Word[]> {
    return db.words.toArray();
  },

  async updateWord(id: string, updates: Partial<Word>): Promise<void> {
    await db.words.update(id, updates);
  },

  async deleteWord(id: string): Promise<void> {
    await db.words.delete(id);
  },

  async getDueWords(): Promise<Word[]> {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return db.words.where('nextReviewDate').belowOrEqual(today).toArray();
  },

  async getWordsByStatus(status: Word['status']): Promise<Word[]> {
    return db.words.where('status').equals(status).toArray();
  },

  async getWordsBySource(source: Word['source']): Promise<Word[]> {
    return db.words.where('source').equals(source).toArray();
  },

  async searchWords(query: string): Promise<Word[]> {
    const lowerQuery = query.toLowerCase();
    return db.words
      .filter(
        (w) =>
          w.word.toLowerCase().includes(lowerQuery) ||
          w.translation.some((t) => t.toLowerCase().includes(lowerQuery))
      )
      .toArray();
  },

  async getWordCount(): Promise<number> {
    return db.words.count();
  },

  async getWordCountByStatus(status: Word['status']): Promise<number> {
    return db.words.where('status').equals(status).count();
  },

  async wordExists(word: string, language: 'en' | 'de'): Promise<boolean> {
    const existing = await db.words
      .where('word')
      .equalsIgnoreCase(word)
      .and((w) => w.language === language)
      .first();
    return existing !== undefined;
  },

  async getWordsSorted(
    sortBy: 'dateAdded' | 'word' | 'difficulty',
    order: 'asc' | 'desc' = 'desc'
  ): Promise<Word[]> {
    const words = await db.words.toArray();
    return words.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'dateAdded') cmp = a.dateAdded.getTime() - b.dateAdded.getTime();
      else if (sortBy === 'word') cmp = a.word.localeCompare(b.word);
      else cmp = a.difficulty - b.difficulty;
      return order === 'asc' ? cmp : -cmp;
    });
  },
};

// ── Router: pick Supabase or Dexie based on auth state ────────────────────

function getAdapter() {
  const { user, isLoading } = useAuthStore.getState();
  return !isLoading && user ? supabaseWordAdapter : dexieWordAdapter;
}

// ── Public API (identical interface — no call sites need to change) ────────

export const vocabularyStorage = {
  addWord: (...args: Parameters<typeof dexieWordAdapter.addWord>) =>
    getAdapter().addWord(...args),
  getWord: (...args: Parameters<typeof dexieWordAdapter.getWord>) =>
    getAdapter().getWord(...args),
  getAllWords: () => getAdapter().getAllWords(),
  updateWord: (...args: Parameters<typeof dexieWordAdapter.updateWord>) =>
    getAdapter().updateWord(...args),
  deleteWord: (...args: Parameters<typeof dexieWordAdapter.deleteWord>) =>
    getAdapter().deleteWord(...args),
  getDueWords: () => getAdapter().getDueWords(),
  getWordsByStatus: (...args: Parameters<typeof dexieWordAdapter.getWordsByStatus>) =>
    getAdapter().getWordsByStatus(...args),
  getWordsBySource: (...args: Parameters<typeof dexieWordAdapter.getWordsBySource>) =>
    getAdapter().getWordsBySource(...args),
  searchWords: (...args: Parameters<typeof dexieWordAdapter.searchWords>) =>
    getAdapter().searchWords(...args),
  getWordCount: () => getAdapter().getWordCount(),
  getWordCountByStatus: (...args: Parameters<typeof dexieWordAdapter.getWordCountByStatus>) =>
    getAdapter().getWordCountByStatus(...args),
  wordExists: (...args: Parameters<typeof dexieWordAdapter.wordExists>) =>
    getAdapter().wordExists(...args),
  getWordsSorted: (...args: Parameters<typeof dexieWordAdapter.getWordsSorted>) =>
    getAdapter().getWordsSorted(...args),
};
