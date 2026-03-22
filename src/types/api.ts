import type { Example, Language } from './vocabulary';

// OpenAI API types

export interface WordLookupRequest {
  word: string;
  sourceLanguage: Language;
  targetLanguage: Language;
}

export interface WordLookupResponse {
  word: string;
  translation: string[];
  definition: string;
  partOfSpeech: string[];
  ipa: string;
  examples: Example[];
  synonyms: string[];
  relatedWords: string[];
  usageHints: string[];
}

export interface CuratedVocabularyRequest {
  level: 'B2' | 'C1';
  topics: string[];
  count: number;
  excludeWords: string[]; // already in user's vocabulary
}

export interface CuratedVocabularyResponse {
  words: string[];
}

export interface TranslationVariant {
  style: 'standard' | 'formal' | 'informal';
  label: string;
  text: string;
}

export interface SentenceTranslationResponse {
  original: string;
  variants: TranslationVariant[];
}

export interface TextTranslationResponse {
  original: string;
  translation: string;
}

// Cache types
export interface CacheEntry {
  key: string;
  response: string;
  timestamp: number;
}

// Settings types
export interface UserSettings {
  userId: string;
  wordCount: 15 | 20 | 25 | 30;
  direction: 'de-to-en' | 'en-to-de';
  userWordsRatio: number;
  theme: 'light' | 'dark';
  soundEnabled: boolean;
}
