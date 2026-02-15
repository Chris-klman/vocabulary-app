import OpenAI from 'openai';
import type { WordLookupResponse, CuratedVocabularyResponse, Language } from '@/types';
import { OpenAICache } from './cache';
import {
  createDictionaryLookupPrompt,
  createCuratedVocabularyPrompt,
  extractJSON,
} from './prompts';

// Initialize cache
const cache = new OpenAICache();

// Initialize OpenAI client (lazy initialization)
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env.local file.'
      );
    }

    openaiClient = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true, // For PWA client-side usage
    });
  }

  return openaiClient;
}

/**
 * Look up a word in the dictionary using OpenAI
 */
export async function lookupWord(
  word: string,
  sourceLanguage: Language
): Promise<WordLookupResponse> {
  const cacheKey = `word:${sourceLanguage}:${word.toLowerCase()}`;

  // Try cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Make API call
  try {
    const client = getOpenAIClient();
    const prompt = createDictionaryLookupPrompt(word, sourceLanguage);

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Parse the JSON response
    const result = extractJSON(content) as WordLookupResponse;

    // Validate response structure
    if (!result.word || !result.translation || !result.definition) {
      throw new Error('Invalid response structure from OpenAI');
    }

    // Cache the result
    await cache.set(cacheKey, JSON.stringify(result));

    return result;
  } catch (error) {
    console.error('Error looking up word:', error);
    throw new Error(
      `Failed to look up word "${word}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Generate curated vocabulary words using OpenAI
 */
export async function generateCuratedVocabulary(
  level: 'B2' | 'C1',
  topics: string[],
  count: number,
  excludeWords: string[]
): Promise<CuratedVocabularyResponse> {
  const cacheKey = `curated:${level}:${topics.sort().join(',')}:${count}:${excludeWords.length}`;

  // Try cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Make API call
  try {
    const client = getOpenAIClient();
    const prompt = createCuratedVocabularyPrompt(level, topics, count, excludeWords);

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // Parse the JSON response
    const words = extractJSON(content) as string[];

    if (!Array.isArray(words) || words.length === 0) {
      throw new Error('Invalid response structure from OpenAI');
    }

    const result: CuratedVocabularyResponse = { words };

    // Cache the result (shorter cache time for curated words)
    await cache.set(cacheKey, JSON.stringify(result));

    return result;
  } catch (error) {
    console.error('Error generating curated vocabulary:', error);
    throw new Error(
      `Failed to generate curated vocabulary: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Clear the OpenAI cache
 */
export async function clearCache(): Promise<void> {
  await cache.clearAll();
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  return cache.getStats();
}

/**
 * Clean expired cache entries
 */
export async function cleanExpiredCache(): Promise<void> {
  await cache.cleanExpired();
}
