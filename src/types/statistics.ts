// Statistics types

export interface DailyStat {
  date: Date;
  wordsStudied: number;
  correctAnswers: number;
  incorrectAnswers: number;
  sessionDuration: number; // minutes
  newWordsAdded: number;
}

export interface Statistics {
  userId: string;
  streak: number;
  lastStudyDate: Date | null;
  totalWordsLearned: number;
  totalSessions: number;
  totalCorrect: number;
  totalIncorrect: number;
  dailyStats: DailyStat[];
}

export interface StatsOverview {
  streak: number;
  wordsLearnedToday: number;
  totalWords: number;
  successRate: number; // percentage (0-100)
}

export interface ChartDataPoint {
  date: string;
  wordsStudied: number;
  correctAnswers: number;
  incorrectAnswers: number;
}

export type StatsPeriod = 'weekly' | 'monthly';
