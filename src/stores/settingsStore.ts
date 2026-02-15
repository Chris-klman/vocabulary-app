import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  // Session config
  wordCount: 15 | 20 | 25 | 30;
  direction: 'de-to-en' | 'en-to-de';
  userWordsRatio: number; // 0-1 (e.g., 0.5 = 50% user words)

  // UI preferences
  theme: 'light' | 'dark';
  soundEnabled: boolean;

  // Actions
  setWordCount: (count: 15 | 20 | 25 | 30) => void;
  setDirection: (direction: 'de-to-en' | 'en-to-de') => void;
  setUserWordsRatio: (ratio: number) => void;
  toggleDirection: () => void;
  setSoundEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // Default values
      wordCount: 20,
      direction: 'de-to-en',
      userWordsRatio: 0.5,
      theme: 'light',
      soundEnabled: true,

      // Actions
      setWordCount: (count) => set({ wordCount: count }),
      setDirection: (direction) => set({ direction }),
      setUserWordsRatio: (ratio) => {
        // Ensure ratio is between 0 and 1
        const clampedRatio = Math.max(0, Math.min(1, ratio));
        set({ userWordsRatio: clampedRatio });
      },
      toggleDirection: () =>
        set((state) => ({
          direction: state.direction === 'de-to-en' ? 'en-to-de' : 'de-to-en',
        })),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
    }),
    {
      name: 'vocabulary-settings',
    }
  )
);
