import { supabase } from './client';
import { db } from '@/lib/db';
import { wordToRow, assessmentWordToRow } from './mappers';

const MIGRATION_KEY = 'vocab_app_migrated_v1';

export function isMigrated(): boolean {
  return localStorage.getItem(MIGRATION_KEY) === 'done';
}

/**
 * One-shot migration of all local Dexie data to Supabase.
 * Safe to call multiple times — guarded by localStorage flag and uses upsert.
 */
export async function migrateLocalDataToCloud(userId: string): Promise<void> {
  if (isMigrated()) return;

  const [localWords, localAssessmentWords] = await Promise.all([
    db.words.toArray(),
    db.assessmentWords.toArray(),
  ]);

  if (localWords.length === 0 && localAssessmentWords.length === 0) {
    localStorage.setItem(MIGRATION_KEY, 'done');
    return;
  }

  if (localWords.length > 0) {
    const rows = localWords.map((w) => wordToRow(w, userId));
    // Batch in chunks of 500 to stay within Supabase request limits
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabase
        .from('words')
        .upsert(rows.slice(i, i + 500), { onConflict: 'id' });
      if (error) throw new Error(`Word migration failed: ${error.message}`);
    }
  }

  if (localAssessmentWords.length > 0) {
    const rows = localAssessmentWords.map((w) => assessmentWordToRow(w, userId));
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabase
        .from('assessment_words')
        .upsert(rows.slice(i, i + 500), { onConflict: 'id' });
      if (error) throw new Error(`Assessment migration failed: ${error.message}`);
    }
  }

  localStorage.setItem(MIGRATION_KEY, 'done');
}
