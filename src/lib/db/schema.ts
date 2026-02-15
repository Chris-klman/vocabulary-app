import Dexie, { Table } from 'dexie';
import type { Word, LearningSession, Statistics, UserSettings } from '@/types';

// Define the database class
export class VocabularyDatabase extends Dexie {
  // Declare tables
  words!: Table<Word, string>;
  sessions!: Table<LearningSession, string>;
  statistics!: Table<Statistics, string>;
  settings!: Table<UserSettings, string>;

  constructor() {
    super('VocabularyApp');

    // Define schema
    this.version(1).stores({
      // Words table with indexes
      words: 'id, word, language, source, status, nextReviewDate, dateAdded',

      // Sessions table
      sessions: 'id, startTime, completed',

      // Statistics table (single row per user)
      statistics: 'userId',

      // Settings table (single row per user)
      settings: 'userId',
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
  // Clear all data (useful for testing)
  async clearAll() {
    await db.words.clear();
    await db.sessions.clear();
    await db.statistics.clear();
    await db.settings.clear();
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
