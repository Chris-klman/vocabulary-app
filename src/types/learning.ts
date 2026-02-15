import type { Word } from './vocabulary';

// Learning session types

export interface SessionConfig {
  wordCount: 15 | 20 | 25 | 30;
  direction: 'de-to-en' | 'en-to-de';
  userWordsRatio: number; // 0-1 (e.g., 0.5 = 50% user words)
}

export interface Attempt {
  timestamp: Date;
  userAnswer: string;
  correct: boolean;
  selfAssessment: 'knew' | 'didnt-know' | null;
  timeSpent: number; // milliseconds
}

export interface SessionWord {
  wordId: string;
  word: Word;
  attempts: Attempt[];
  completed: boolean;
  finalResult: 'correct' | 'incorrect' | 'skipped' | null;
}

export interface SessionResult {
  wordId: string;
  correct: boolean;
  attempts: number;
  selfAssessment: 'knew' | 'didnt-know';
}

export interface LearningSession {
  id: string;
  startTime: Date;
  endTime: Date | null;
  config: SessionConfig;
  words: SessionWord[];
  results: SessionResult[];
  completed: boolean;
}

// SRS Algorithm types
export interface SRSCard {
  easeFactor: number; // 1.3 - 2.5
  interval: number; // days
  repetitions: number;
}

export type Quality = 0 | 1 | 2 | 3 | 4 | 5;
// 0: Total blackout
// 1: Incorrect, but recognized
// 2: Incorrect, but easy to recall
// 3: Correct with difficulty
// 4: Correct with hesitation
// 5: Perfect recall

export type Direction = SessionConfig['direction'];
export type SelfAssessment = Attempt['selfAssessment'];
