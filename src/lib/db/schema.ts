import Dexie, { Table } from 'dexie';
import type { Word, LearningSession, Statistics, UserSettings, AssessmentWord } from '@/types';

// Define the database class
export class VocabularyDatabase extends Dexie {
  // Declare tables
  words!: Table<Word, string>;
  sessions!: Table<LearningSession, string>;
  statistics!: Table<Statistics, string>;
  settings!: Table<UserSettings, string>;
  assessmentWords!: Table<AssessmentWord, string>;

  constructor() {
    super('VocabularyApp');

    // Version 1 — original tables
    this.version(1).stores({
      words: 'id, word, language, source, status, nextReviewDate, dateAdded',
      sessions: 'id, startTime, completed',
      statistics: 'userId',
      settings: 'userId',
    });

    // Version 2 — adds assessmentWords table for the Einstufen feature
    this.version(2).stores({
      words: 'id, word, language, source, status, nextReviewDate, dateAdded',
      sessions: 'id, startTime, completed',
      statistics: 'userId',
      settings: 'userId',
      assessmentWords: 'id, word, status, batchId, createdAt',
    });
  }
}

// Create and export database instance
export const db = new VocabularyDatabase();

// Helper function to initialize database (if needed)
export async function initializeDatabase() {
  try {
    // Check if database is accessible
    await db.open();
    console.log('Database initialized successfully');

    // Initialize default settings if they don't exist
    const existingSettings = await db.settings.get('default-user');
    if (!existingSettings) {
      await db.settings.add({
        userId: 'default-user',
        wordCount: 20,
        direction: 'de-to-en',
        userWordsRatio: 0.5,
        theme: 'light',
        soundEnabled: true,
      });
      console.log('Default settings created');
    }

    // Initialize statistics if they don't exist
    const existingStats = await db.statistics.get('default-user');
    if (!existingStats) {
      await db.statistics.add({
        userId: 'default-user',
        streak: 0,
        lastStudyDate: null,
        totalWordsLearned: 0,
        totalSessions: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        dailyStats: [],
      });
      console.log('Default statistics created');
    }

    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}

// Export database operations helpers
export const dbHelpers = {
  async clearAll() {
    await db.words.clear();
    await db.sessions.clear();
    await db.statistics.clear();
    await db.settings.clear();
    await db.assessmentWords.clear();
  },

  // Get database stats
  async getStats() {
    const wordCount = await db.words.count();
    const sessionCount = await db.sessions.count();

    return {
      totalWords: wordCount,
      totalSessions: sessionCount,
    };
  },

  // Export data (for backup)
  async exportData() {
    const words = await db.words.toArray();
    const sessions = await db.sessions.toArray();
    const statistics = await db.statistics.toArray();
    const settings = await db.settings.toArray();

    return {
      words,
      sessions,
      statistics,
      settings,
      exportDate: new Date().toISOString(),
    };
  },

  // Import data (for restore)
  async importData(data: {
    words: Word[];
    sessions: LearningSession[];
    statistics: Statistics[];
    settings: UserSettings[];
  }) {
    await this.clearAll();

    await db.words.bulkAdd(data.words);
    await db.sessions.bulkAdd(data.sessions);
    await db.statistics.bulkAdd(data.statistics);
    await db.settings.bulkAdd(data.settings);
  },
};
