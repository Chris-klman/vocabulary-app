import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type InputType = 'word' | 'sentence' | 'text';

/**
 * Classifies user input into word, sentence, or multi-sentence text.
 * - word: single term with no whitespace
 * - sentence: multiple words forming at most one sentence
 * - text: multiple sentences or a paragraph
 */
export function classifyInput(input: string): InputType {
  const trimmed = input.trim();

  // Single word (no whitespace)
  if (!/\s/.test(trimmed)) return 'word';

  // Count sentence endings (.!?) followed by a space or end-of-string
  const sentenceEndings = trimmed.match(/[.!?…]+(?:\s+|$)/g);
  const sentenceCount = sentenceEndings ? sentenceEndings.length : 0;

  if (sentenceCount > 1) return 'text';
  return 'sentence';
}

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/**
 * Format a date to a short string (e.g., "Jan 15")
 */
export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
