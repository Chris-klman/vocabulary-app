import { db } from '../db';
import { supabaseAssessmentAdapter } from '../supabase/assessmentAdapter';
import { useAuthStore } from '@/stores/authStore';
import type { AssessmentWord } from '@/types';
import type { AssessmentWordCandidate } from '@/lib/openai/client';

// ── Dexie (local) adapter ──────────────────────────────────────────────────

const dexieAssessmentAdapter = {
  async getPendingWords(limit = 100): Promise<AssessmentWord[]> {
    return db.assessmentWords.where('status').equals('pending').limit(limit).toArray();
  },

  async getPendingCount(): Promise<number> {
    return db.assessmentWords.where('status').equals('pending').count();
  },

  async getAllWordStrings(): Promise<string[]> {
    const all = await db.assessmentWords.toArray();
    return all.map((w) => w.word.toLowerCase());
  },

  async addBatch(candidates: AssessmentWordCandidate[]): Promise<void> {
    const batchId = crypto.randomUUID();
    const now = new Date();

    const existing = await db.assessmentWords.toArray();
    const existingSet = new Set(existing.map((w) => w.word.toLowerCase()));

    const newWords: AssessmentWord[] = candidates
      .filter((c) => !existingSet.has(c.word.toLowerCase()))
      .map((c) => ({
        id: crypto.randomUUID(),
        word: c.word,
        translation: c.translation,
        partOfSpeech: c.partOfSpeech ?? '',
        batchId,
        createdAt: now,
        status: 'pending' as const,
      }));

    if (newWords.length > 0) {
      await db.assessmentWords.bulkAdd(newWords);
    }
  },

  async markKnown(id: string): Promise<void> {
    await db.assessmentWords.update(id, { status: 'known' });
  },

  async markAdded(id: string): Promise<void> {
    await db.assessmentWords.update(id, { status: 'added' });
  },

  async resetKnown(): Promise<void> {
    const known = await db.assessmentWords.where('status').equals('known').toArray();
    await Promise.all(known.map((w) => db.assessmentWords.update(w.id, { status: 'pending' })));
  },
};

// ── Router ─────────────────────────────────────────────────────────────────

function getAdapter() {
  const { user, isLoading } = useAuthStore.getState();
  return !isLoading && user ? supabaseAssessmentAdapter : dexieAssessmentAdapter;
}

// ── Public API ─────────────────────────────────────────────────────────────

export const assessmentStorage = {
  getPendingWords: (...args: Parameters<typeof dexieAssessmentAdapter.getPendingWords>) =>
    getAdapter().getPendingWords(...args),
  getPendingCount: () => getAdapter().getPendingCount(),
  getAllWordStrings: () => getAdapter().getAllWordStrings(),
  addBatch: (...args: Parameters<typeof dexieAssessmentAdapter.addBatch>) =>
    getAdapter().addBatch(...args),
  markKnown: (...args: Parameters<typeof dexieAssessmentAdapter.markKnown>) =>
    getAdapter().markKnown(...args),
  markAdded: (...args: Parameters<typeof dexieAssessmentAdapter.markAdded>) =>
    getAdapter().markAdded(...args),
  resetKnown: () => getAdapter().resetKnown(),
};
