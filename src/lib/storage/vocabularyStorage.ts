import { db } from '../db';
import type { Word } from '@/types';

/**
 * Vocabulary Storage Service
 * Provides CRUD operations for words using Dexie
 */
export const vocabularyStorage = {
  /**
   * Add a new word to the vocabulary
   */
  async addWord(word: Omit<Word, 'id' | 'dateAdded' | 'difficulty' | 'easeFactor' | 'interval' | 'repetitions' | 'nextReviewDate' | 'lastReviewed' | 'reviewCount' | 'correctCount' | 'incorrectCount' | 'status'>): Promise<Word> {
    const id = crypto.randomUUID();
    const now = new Date();

    const newWord: Word = {
      ...word,
      id,
      dateAdded: now,

      // Initialize SRS values
      difficulty: 3, // Medium difficulty
      easeFactor: 2.5, // Default ease factor
      interval: 1, // 1 day initial interval
      repetitions: 0,
      nextReviewDate: now, // Available immediately
      lastReviewed: null,
      reviewCount: 0,
      correctCount: 0,
      incorrectCount: 0,
      status: 'learning',
    };

    await db.words.add(newWord);
    console.log('Word added:', newWord.word);
    return newWord;
  },

  /**
   * Get a word by ID
   */
  async getWord(id: string): Promise<Word | undefined> {
    return db.words.get(id);
  },

  /**
   * Get all words
   */
  async getAllWords(): Promise<Word[]> {
    return db.words.toArray();
  },

  /**
   * Update a word
   */
  async updateWord(id: string, updates: Partial<Word>): Promise<void> {
    await db.words.update(id, updates);
    console.log('Word updated:', id);
  },

  /**
   * Delete a word
   */
  async deleteWord(id: string): Promise<void> {
    await db.words.delete(id);
    console.log('Word deleted:', id);
  },

  /**
   * Get words that are due for review (nextReviewDate <= today)
   */
  async getDueWords(): Promise<Word[]> {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    return db.words
      .where('nextReviewDate')
      .belowOrEqual(today)
      .toArray();
  },

  /**
   * Get words by status
   */
  async getWordsByStatus(status: Word['status']): Promise<Word[]> {
    return db.words
      .where('status')
      .equals(status)
      .toArray();
  },

  /**
   * Get words by source
   */
  async getWordsBySource(source: Word['source']): Promise<Word[]> {
    return db.words
      .where('source')
      .equals(source)
      .toArray();
  },

  /**
   * Search words by word or translation
   */
  async searchWords(query: string): Promise<Word[]> {
    const lowerQuery = query.toLowerCase();

    return db.words
      .filter(word =>
        word.word.toLowerCase().includes(lowerQuery) ||
        word.translation.some(t => t.toLowerCase().includes(lowerQuery))
      )
      .toArray();
  },

  /**
   * Get total word count
   */
  async getWordCount(): Promise<number> {
    return db.words.count();
  },

  /**
   * Get word count by status
   */
  async getWordCountByStatus(status: Word['status']): Promise<number> {
    return db.words
      .where('status')
      .equals(status)
      .count();
  },

  /**
   * Check if a word already exists
   */
  async wordExists(word: string, language: 'en' | 'de'): Promise<boolean> {
    const existingWord = await db.words
      .where('word')
      .equalsIgnoreCase(word)
      .and(w => w.language === language)
      .first();

    return existingWord !== undefined;
  },

  /**
   * Get all words sorted by a specific field
   */
  async getWordsSorted(sortBy: 'dateAdded' | 'word' | 'difficulty', order: 'asc' | 'desc' = 'desc'): Promise<Word[]> {
    const words = await db.words.toArray();

    return words.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'dateAdded':
          comparison = a.dateAdded.getTime() - b.dateAdded.getTime();
          break;
        case 'word':
          comparison = a.word.localeCompare(b.word);
          break;
        case 'difficulty':
          comparison = a.difficulty - b.difficulty;
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });
  },
};
