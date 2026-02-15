import { useQuery } from '@tanstack/react-query';
import { lookupWord } from '@/lib/openai';
import type { Language, WordLookupResponse } from '@/types';

interface UseWordLookupOptions {
  word: string;
  sourceLanguage: Language;
  enabled?: boolean;
}

export function useWordLookup({ word, sourceLanguage, enabled = true }: UseWordLookupOptions) {
  return useQuery<WordLookupResponse, Error>({
    queryKey: ['word-lookup', word.toLowerCase(), sourceLanguage],
    queryFn: () => lookupWord(word, sourceLanguage),
    enabled: enabled && word.trim().length > 0,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days (formerly cacheTime)
    retry: 2,
  });
}
