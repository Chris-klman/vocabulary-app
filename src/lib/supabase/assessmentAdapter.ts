import { supabase } from './client';
import { assessmentWordFromRow, assessmentWordToRow } from './mappers';
import type { AssessmentWord } from '@/types';
import type { AssessmentWordCandidate } from '@/lib/openai/client';

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export const supabaseAssessmentAdapter = {
  async getPendingWords(limit = 100): Promise<AssessmentWord[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('assessment_words')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(assessmentWordFromRow);
  },

  async getPendingCount(): Promise<number> {
    const userId = await getUserId();
    const { count, error } = await supabase
      .from('assessment_words')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'pending');
    if (error) throw error;
    return count ?? 0;
  },

  async getAllWordStrings(): Promise<string[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('assessment_words')
      .select('word')
      .eq('user_id', userId);
    if (error) throw error;
    return (data ?? []).map((r) => (r.word as string).toLowerCase());
  },

  async addBatch(candidates: AssessmentWordCandidate[]): Promise<void> {
    const userId = await getUserId();
    const batchId = crypto.randomUUID();
    const now = new Date();

    // Deduplicate against existing entries
    const existing = await this.getAllWordStrings();
    const existingSet = new Set(existing);

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

    if (newWords.length === 0) return;

    const rows = newWords.map((w) => assessmentWordToRow(w, userId));
    const { error } = await supabase.from('assessment_words').insert(rows);
    if (error) throw error;
  },

  async markKnown(id: string): Promise<void> {
    const userId = await getUserId();
    const { error } = await supabase
      .from('assessment_words')
      .update({ status: 'known' })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async markAdded(id: string): Promise<void> {
    const userId = await getUserId();
    const { error } = await supabase
      .from('assessment_words')
      .update({ status: 'added' })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async resetKnown(): Promise<void> {
    const userId = await getUserId();
    const { error } = await supabase
      .from('assessment_words')
      .update({ status: 'pending' })
      .eq('user_id', userId)
      .eq('status', 'known');
    if (error) throw error;
  },
};
