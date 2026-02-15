import { create } from 'zustand';
import type { LearningSession, Attempt } from '@/types';

interface SessionStore {
  currentSession: LearningSession | null;
  currentWordIndex: number;

  // Actions
  startSession: (session: LearningSession) => void;
  nextWord: () => void;
  previousWord: () => void;
  recordAttempt: (attempt: Attempt) => void;
  markWordComplete: (finalResult: 'correct' | 'incorrect' | 'skipped') => void;
  endSession: () => void;
  resetSession: () => void;

  // Getters
  getCurrentWord: () => LearningSession['words'][0] | null;
  getProgress: () => { current: number; total: number; percentage: number };
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  currentSession: null,
  currentWordIndex: 0,

  startSession: (session) =>
    set({ currentSession: session, currentWordIndex: 0 }),

  nextWord: () =>
    set((state) => {
      if (!state.currentSession) return state;
      const nextIndex = state.currentWordIndex + 1;

      if (nextIndex >= state.currentSession.words.length) {
        // Session complete
        return state;
      }

      return { currentWordIndex: nextIndex };
    }),

  previousWord: () =>
    set((state) => {
      const prevIndex = Math.max(0, state.currentWordIndex - 1);
      return { currentWordIndex: prevIndex };
    }),

  recordAttempt: (attempt) =>
    set((state) => {
      if (!state.currentSession) return state;

      const updatedWords = [...state.currentSession.words];
      const currentWord = updatedWords[state.currentWordIndex];

      if (currentWord) {
        currentWord.attempts.push(attempt);
      }

      return {
        currentSession: {
          ...state.currentSession,
          words: updatedWords,
        },
      };
    }),

  markWordComplete: (finalResult) =>
    set((state) => {
      if (!state.currentSession) return state;

      const updatedWords = [...state.currentSession.words];
      const currentWord = updatedWords[state.currentWordIndex];

      if (currentWord) {
        currentWord.completed = true;
        currentWord.finalResult = finalResult;
      }

      return {
        currentSession: {
          ...state.currentSession,
          words: updatedWords,
        },
      };
    }),

  endSession: () =>
    set((state) => {
      if (!state.currentSession) return state;

      return {
        currentSession: {
          ...state.currentSession,
          endTime: new Date(),
          completed: true,
        },
      };
    }),

  resetSession: () =>
    set({ currentSession: null, currentWordIndex: 0 }),

  getCurrentWord: () => {
    const state = get();
    if (!state.currentSession) return null;
    return state.currentSession.words[state.currentWordIndex] || null;
  },

  getProgress: () => {
    const state = get();
    if (!state.currentSession) {
      return { current: 0, total: 0, percentage: 0 };
    }

    const total = state.currentSession.words.length;
    const current = state.currentWordIndex + 1;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return { current, total, percentage };
  },
}));
