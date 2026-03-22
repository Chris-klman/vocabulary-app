// Core vocabulary types

export interface Example {
  english: string;
  german: string;
}

export interface Word {
  id: string;
  word: string;
  language: 'en' | 'de';
  translation: string[];

  // Dictionary data (AI-generated)
  definition: string;
  partOfSpeech: string[];
  ipa: string;
  examples: Example[];
  synonyms: string[];
  relatedWords: string[];
  usageHints: string[];

  // SRS data
  difficulty: number; // 1-5
  easeFactor: number; // SM-2 algorithm
  interval: number; // days until next review
  repetitions: number;
  nextReviewDate: Date;

  // Tracking
  source: 'user-added' | 'curated' | 'assessment';
  dateAdded: Date;
  lastReviewed: Date | null;
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  status: 'learning' | 'mastered' | 'difficult';

  // Cached OpenAI response (optional)
  cachedResponse?: string;
  cacheTimestamp?: Date;
}

export type WordStatus = Word['status'];
export type WordSource = Word['source'];
export type Language = Word['language'];

// Assessment word — candidate shown in Einstufen screen
export interface AssessmentWord {
  id: string;
  word: string;
  translation: string;   // single string for quick display
  partOfSpeech: string;
  batchId: string;
  createdAt: Date;
  status: 'pending' | 'known' | 'added';
}

// Sorting and filtering types
export type SortOption = 'dateAdded' | 'alphabetical' | 'difficulty';
export type FilterOption = 'all' | 'learning' | 'mastered' | 'difficult';
