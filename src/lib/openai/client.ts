import OpenAI from 'openai';
import type { WordLookupResponse, CuratedVocabularyResponse, SentenceTranslationResponse, TextTranslationResponse, Language, TranslationVariant, Example } from '@/types';
import { OpenAICache } from './cache';
import {
  createDictionaryLookupPrompt,
  createCuratedVocabularyPrompt,
  createLearningCardPrompt,
  createAssessmentWordsPrompt,
  createSentenceTranslationPrompt,
  createTextTranslationPrompt,
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
      max_tokens: 900,
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

export interface LearningCard {
  word: string;
  exampleSentence: string;
  exampleSentenceDe: string;
  synonyms: string[];
  synonymsDe: string[];
  translation: string;
  additionalExamples: string[];
}

/**
 * Generate learning cards for a batch of words
 */
export async function generateLearningCards(
  words: string[]
): Promise<LearningCard[]> {
  const cacheKey = `learning:${words.sort().join(',')}`;

  const cached = await cache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  try {
    const client = getOpenAIClient();
    const prompt = createLearningCardPrompt(words);

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.4,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    const cards = extractJSON(content) as LearningCard[];
    if (!Array.isArray(cards) || cards.length === 0) {
      throw new Error('Invalid learning cards response');
    }

    await cache.set(cacheKey, JSON.stringify(cards));
    return cards;
  } catch (error) {
    console.error('Error generating learning cards:', error);
    throw new Error(
      `Failed to generate learning cards: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export interface AssessmentWordCandidate {
  word: string;
  translation: string;
  partOfSpeech: string;
}

/**
 * Generate a batch of vocabulary candidates for the Einstufen (assessment) screen.
 * Returns lightweight word + translation pairs — no full learning card data.
 */
export async function generateAssessmentWords(
  count: number,
  excludeWords: string[]
): Promise<AssessmentWordCandidate[]> {
  try {
    const client = getOpenAIClient();
    const prompt = createAssessmentWordsPrompt(count, excludeWords);

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.9, // Higher variety for diverse word suggestions
      max_tokens: 1200,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content in OpenAI response');

    const words = extractJSON(content) as AssessmentWordCandidate[];
    if (!Array.isArray(words) || words.length === 0) {
      throw new Error('Invalid assessment words response');
    }

    return words;
  } catch (error) {
    console.error('Error generating assessment words:', error);
    throw new Error(
      `Failed to generate assessment words: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Translate a single sentence with three style variants (standard, formal, informal)
 */
export async function translateSentence(
  sentence: string,
  sourceLanguage: Language
): Promise<SentenceTranslationResponse> {
  const cacheKey = `sentence:${sourceLanguage}:${sentence.toLowerCase().trim()}`;

  const cached = await cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  try {
    const client = getOpenAIClient();
    const prompt = createSentenceTranslationPrompt(sentence, sourceLanguage);

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.5,
      max_tokens: 600,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content in OpenAI response');

    const result = extractJSON(content) as SentenceTranslationResponse;
    if (!result.variants || result.variants.length === 0) {
      throw new Error('Invalid sentence translation response');
    }

    await cache.set(cacheKey, JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('Error translating sentence:', error);
    throw new Error(
      `Failed to translate sentence: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Translate a longer text into a single natural translation
 */
export async function translateText(
  text: string,
  sourceLanguage: Language
): Promise<TextTranslationResponse> {
  const cacheKey = `text:${sourceLanguage}:${text.toLowerCase().trim().slice(0, 120)}`;

  const cached = await cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  try {
    const client = getOpenAIClient();
    const prompt = createTextTranslationPrompt(text, sourceLanguage);

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content in OpenAI response');

    const result = extractJSON(content) as TextTranslationResponse;
    if (!result.translation) {
      throw new Error('Invalid text translation response');
    }

    await cache.set(cacheKey, JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('Error translating text:', error);
    throw new Error(
      `Failed to translate text: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ── Partial JSON extraction helpers ─────────────────────────────────────────

/** Partial word data emitted progressively as fields complete during streaming */
export type PartialWordData = {
  word: string;
  translation?: string[];
  definition?: string;
  partOfSpeech?: string[];
  ipa?: string;
  examples?: Example[];
  synonyms?: string[];
  relatedWords?: string[];
  usageHints?: string[];
};

/** Extract a completed JSON string field from a partial buffer */
function extractStringField(buffer: string, field: string): string | undefined {
  const regex = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`);
  const match = buffer.match(regex);
  return match ? unescapeJsonFragment(match[1]) : undefined;
}

/** Extract a completed JSON string-array field from a partial buffer */
function extractStringArray(buffer: string, field: string): string[] | undefined {
  const startRegex = new RegExp(`"${field}"\\s*:\\s*\\[`);
  const startMatch = buffer.match(startRegex);
  if (!startMatch || startMatch.index === undefined) return undefined;
  const afterBracket = buffer.slice(startMatch.index + startMatch[0].length);
  const endIdx = afterBracket.indexOf(']');
  if (endIdx === -1) return undefined;
  try {
    return JSON.parse('[' + afterBracket.slice(0, endIdx + 1)) as string[];
  } catch {
    return undefined;
  }
}

/** Find the index of the matching closing bracket/brace in a string */
function findArrayEnd(str: string): number {
  let depth = 1;
  let inString = false;
  let escape = false;
  for (let i = 0; i < str.length; i++) {
    if (escape) { escape = false; continue; }
    if (inString) {
      if (str[i] === '\\') escape = true;
      else if (str[i] === '"') inString = false;
      continue;
    }
    if (str[i] === '"') { inString = true; continue; }
    if (str[i] === '[' || str[i] === '{') depth++;
    else if (str[i] === ']' || str[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Extract the completed examples array from a partial buffer */
function extractExamples(buffer: string): Example[] | undefined {
  const startRegex = /"examples"\s*:\s*\[/;
  const startMatch = buffer.match(startRegex);
  if (!startMatch || startMatch.index === undefined) return undefined;
  const afterBracket = buffer.slice(startMatch.index + startMatch[0].length);
  const endIdx = findArrayEnd(afterBracket);
  if (endIdx === -1) return undefined;
  try {
    return JSON.parse('[' + afterBracket.slice(0, endIdx + 1)) as Example[];
  } catch {
    return undefined;
  }
}

/** Extract all completed sentence variant objects from a partial buffer */
function extractSentenceVariants(buffer: string): TranslationVariant[] {
  const variants: TranslationVariant[] = [];
  const variantRegex = /\{\s*"style"\s*:\s*"([^"]+)"\s*,\s*"label"\s*:\s*"([^"]+)"\s*,\s*"text"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
  let match;
  while ((match = variantRegex.exec(buffer)) !== null) {
    variants.push({
      style: match[1] as TranslationVariant['style'],
      label: match[2],
      text: unescapeJsonFragment(match[3]),
    });
  }
  return variants;
}

function extractPartialWordData(buffer: string, fallbackWord: string): PartialWordData {
  return {
    word: extractStringField(buffer, 'word') ?? fallbackWord,
    translation: extractStringArray(buffer, 'translation'),
    ipa: extractStringField(buffer, 'ipa'),
    definition: extractStringField(buffer, 'definition'),
    partOfSpeech: extractStringArray(buffer, 'partOfSpeech'),
    examples: extractExamples(buffer),
    synonyms: extractStringArray(buffer, 'synonyms'),
    relatedWords: extractStringArray(buffer, 'relatedWords'),
    usageHints: extractStringArray(buffer, 'usageHints'),
  };
}

// ── Streaming API functions ──────────────────────────────────────────────────

/**
 * Look up a word with streaming — calls onPartial as each field completes.
 * Fields arrive in order: word → translation → definition → ipa → examples → synonyms.
 */
export async function lookupWordStream(
  word: string,
  sourceLanguage: Language,
  onPartial: (data: PartialWordData) => void,
): Promise<WordLookupResponse> {
  const cacheKey = `word:${sourceLanguage}:${word.toLowerCase()}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    const result = JSON.parse(cached) as WordLookupResponse;
    onPartial(result);
    return result;
  }

  try {
    const client = getOpenAIClient();
    const prompt = createDictionaryLookupPrompt(word, sourceLanguage);
    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.3,
      max_tokens: 900,
      stream: true,
    });

    let buffer = '';
    let lastHash = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (!delta) continue;
      buffer += delta;

      const partial = extractPartialWordData(buffer, word);
      // Only re-render when something new became available
      const hash = `${partial.translation?.length ?? 0}|${partial.definition?.length ?? 0}|${partial.examples?.length ?? 0}|${partial.synonyms?.length ?? 0}`;
      if (hash !== lastHash) {
        lastHash = hash;
        onPartial(partial);
      }
    }

    const result = extractJSON(buffer) as WordLookupResponse;
    if (!result.word || !result.translation || !result.definition) {
      throw new Error('Invalid response structure from OpenAI');
    }
    await cache.set(cacheKey, JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('Error streaming word lookup:', error);
    throw new Error(
      `Failed to look up word "${word}": ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Translate a sentence with streaming — immediately calls onPartial with the original,
 * then adds variants one by one as they complete.
 */
export async function translateSentenceStream(
  sentence: string,
  sourceLanguage: Language,
  onPartial: (data: SentenceTranslationResponse) => void,
): Promise<SentenceTranslationResponse> {
  const cacheKey = `sentence:${sourceLanguage}:${sentence.toLowerCase().trim()}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    const result = JSON.parse(cached) as SentenceTranslationResponse;
    onPartial(result);
    return result;
  }

  try {
    const client = getOpenAIClient();
    const prompt = createSentenceTranslationPrompt(sentence, sourceLanguage);

    // Show card immediately — original is known, variants will stream in
    onPartial({ original: sentence, variants: [] });

    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.5,
      max_tokens: 600,
      stream: true,
    });

    let buffer = '';
    let lastVariantCount = 0;
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (!delta) continue;
      buffer += delta;

      const variants = extractSentenceVariants(buffer);
      if (variants.length > lastVariantCount) {
        lastVariantCount = variants.length;
        onPartial({ original: sentence, variants });
      }
    }

    const result = extractJSON(buffer) as SentenceTranslationResponse;
    if (!result.variants || result.variants.length === 0) {
      throw new Error('Invalid sentence translation response');
    }
    await cache.set(cacheKey, JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('Error streaming sentence translation:', error);
    throw new Error(
      `Failed to translate sentence: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Unescape a partial JSON string fragment (may be incomplete at the end)
function unescapeJsonFragment(s: string): string {
  return s
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\');
}

/**
 * Translate a longer text with streaming — calls onChunk as translation text grows.
 * Returns the final complete result (also caches it).
 */
export async function translateTextStream(
  text: string,
  sourceLanguage: Language,
  onChunk: (partialTranslation: string) => void,
): Promise<TextTranslationResponse> {
  const cacheKey = `text:${sourceLanguage}:${text.toLowerCase().trim().slice(0, 120)}`;

  // Cache hit: deliver full text immediately, skip streaming
  const cached = await cache.get(cacheKey);
  if (cached) {
    const result = JSON.parse(cached) as TextTranslationResponse;
    onChunk(result.translation);
    return result;
  }

  try {
    const client = getOpenAIClient();
    const prompt = createTextTranslationPrompt(text, sourceLanguage);

    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
      stream: true,
    });

    let buffer = '';
    let translationStartIndex = -1;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? '';
      if (!delta) continue;
      buffer += delta;

      if (translationStartIndex === -1) {
        // Find start of the translation string value
        const match = buffer.match(/"translation"\s*:\s*"/);
        if (match?.index !== undefined) {
          translationStartIndex = match.index + match[0].length;
        }
      }

      if (translationStartIndex !== -1) {
        // Extract growing translation — strip trailing closing JSON chars if present
        let raw = buffer.slice(translationStartIndex);
        raw = raw.replace(/"\s*}\s*$/, ''); // remove trailing "} that ends the JSON
        onChunk(unescapeJsonFragment(raw));
      }
    }

    const result = extractJSON(buffer) as TextTranslationResponse;
    if (!result.translation) throw new Error('Invalid text translation response');

    await cache.set(cacheKey, JSON.stringify(result));
    return result;
  } catch (error) {
    console.error('Error streaming text translation:', error);
    throw new Error(
      `Failed to translate text: ${error instanceof Error ? error.message : 'Unknown error'}`
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
