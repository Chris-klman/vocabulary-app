import { supabase } from './client';
import { wordFromRow, wordToRow, partialWordToRow } from './mappers';
import type { Word } from '@/types';

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export const supabaseWordAdapter = {
  async addWord(
    word: Omit<Word, 'id' | 'dateAdded' | 'difficulty' | 'easeFactor' | 'interval' | 'repetitions' | 'nextReviewDate' | 'lastReviewed' | 'reviewCount' | 'correctCount' | 'incorrectCount' | 'status'>
  ): Promise<Word> {
    const userId = await getUserId();
    const now = new Date();

    const newWord: Word = {
      ...word,
      id: crypto.randomUUID(),
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

    const { error } = await supabase.from('words').insert(wordToRow(newWord, userId));
    if (error) throw error;
    return newWord;
  },

  async getWord(id: string): Promise<Word | undefined> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data ? wordFromRow(data) : undefined;
  },

  async getAllWords(): Promise<Word[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return (data ?? []).map(wordFromRow);
  },

  async updateWord(id: string, updates: Partial<Word>): Promise<void> {
    const userId = await getUserId();
    const row = partialWordToRow(updates);
    const { error } = await supabase
      .from('words')
      .update(row)
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async deleteWord(id: string): Promise<void> {
    const userId = await getUserId();
    const { error } = await supabase
      .from('words')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  async getDueWords(): Promise<Word[]> {
    const userId = await getUserId();
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('user_id', userId)
      .lte('next_review_date', today.toISOString());
    if (error) throw error;
    return (data ?? []).map(wordFromRow);
  },

  async getWordsByStatus(status: Word['status']): Promise<Word[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status);
    if (error) throw error;
    return (data ?? []).map(wordFromRow);
  },

  async getWordsBySource(source: Word['source']): Promise<Word[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('user_id', userId)
      .eq('source', source);
    if (error) throw error;
    return (data ?? []).map(wordFromRow);
  },

  async searchWords(query: string): Promise<Word[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('user_id', userId)
      .ilike('word', `%${query}%`);
    if (error) throw error;
    return (data ?? []).map(wordFromRow);
  },

  async getWordCount(): Promise<number> {
    const userId = await getUserId();
    const { count, error } = await supabase
      .from('words')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (error) throw error;
    return count ?? 0;
  },

  async getWordCountByStatus(status: Word['status']): Promise<number> {
    const userId = await getUserId();
    const { count, error } = await supabase
      .from('words')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', status);
    if (error) throw error;
    return count ?? 0;
  },

  async wordExists(word: string, language: 'en' | 'de'): Promise<boolean> {
    const userId = await getUserId();
    const { count, error } = await supabase
      .from('words')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .ilike('word', word)
      .eq('language', language);
    if (error) throw error;
    return (count ?? 0) > 0;
  },

  async getWordsSorted(
    sortBy: 'dateAdded' | 'word' | 'difficulty',
    order: 'asc' | 'desc' = 'desc'
  ): Promise<Word[]> {
    const userId = await getUserId();
    const columnMap: Record<string, string> = {
      dateAdded: 'date_added',
      word: 'word',
      difficulty: 'difficulty',
    };
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('user_id', userId)
      .order(columnMap[sortBy], { ascending: order === 'asc' });
    if (error) throw error;
    return (data ?? []).map(wordFromRow);
  },
};
