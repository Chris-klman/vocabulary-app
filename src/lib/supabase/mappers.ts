import type { Word, AssessmentWord } from '@/types';

// ── Word mappers ──────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;

export function wordFromRow(row: Row): Word {
  return {
    id: row.id as string,
    word: row.word as string,
    language: row.language as 'en' | 'de',
    translation: row.translation as string[],
    definition: (row.definition as string) ?? '',
    partOfSpeech: (row.part_of_speech as string[]) ?? [],
    ipa: (row.ipa as string) ?? '',
    examples: (row.examples as { english: string; german: string }[]) ?? [],
    synonyms: (row.synonyms as string[]) ?? [],
    relatedWords: (row.related_words as string[]) ?? [],
    usageHints: (row.usage_hints as string[]) ?? [],
    difficulty: (row.difficulty as number) ?? 3,
    easeFactor: Number(row.ease_factor ?? 2.5),
    interval: (row.interval as number) ?? 1,
    repetitions: (row.repetitions as number) ?? 0,
    nextReviewDate: new Date(row.next_review_date as string),
    source: row.source as Word['source'],
    dateAdded: new Date(row.date_added as string),
    lastReviewed: row.last_reviewed ? new Date(row.last_reviewed as string) : null,
    reviewCount: (row.review_count as number) ?? 0,
    correctCount: (row.correct_count as number) ?? 0,
    incorrectCount: (row.incorrect_count as number) ?? 0,
    status: row.status as Word['status'],
    cachedResponse: (row.cached_response as string | undefined) ?? undefined,
    cacheTimestamp: row.cache_timestamp
      ? new Date(row.cache_timestamp as string)
      : undefined,
  };
}

export function wordToRow(word: Word, userId: string): Row {
  return {
    id: word.id,
    user_id: userId,
    word: word.word,
    language: word.language,
    translation: word.translation,
    definition: word.definition,
    part_of_speech: word.partOfSpeech,
    ipa: word.ipa,
    examples: word.examples,
    synonyms: word.synonyms,
    related_words: word.relatedWords,
    usage_hints: word.usageHints,
    difficulty: word.difficulty,
    ease_factor: word.easeFactor,
    interval: word.interval,
    repetitions: word.repetitions,
    next_review_date: word.nextReviewDate.toISOString(),
    source: word.source,
    date_added: word.dateAdded.toISOString(),
    last_reviewed: word.lastReviewed?.toISOString() ?? null,
    review_count: word.reviewCount,
    correct_count: word.correctCount,
    incorrect_count: word.incorrectCount,
    status: word.status,
    cached_response: word.cachedResponse ?? null,
    cache_timestamp: word.cacheTimestamp?.toISOString() ?? null,
  };
}

// Maps only the keys present in a Partial<Word> update to snake_case.
// Only outputs entries where the value is actually provided.
const WORD_FIELD_MAP: Partial<Record<keyof Word, string>> = {
  word: 'word',
  language: 'language',
  translation: 'translation',
  definition: 'definition',
  partOfSpeech: 'part_of_speech',
  ipa: 'ipa',
  examples: 'examples',
  synonyms: 'synonyms',
  relatedWords: 'related_words',
  usageHints: 'usage_hints',
  difficulty: 'difficulty',
  easeFactor: 'ease_factor',
  interval: 'interval',
  repetitions: 'repetitions',
  nextReviewDate: 'next_review_date',
  source: 'source',
  dateAdded: 'date_added',
  lastReviewed: 'last_reviewed',
  reviewCount: 'review_count',
  correctCount: 'correct_count',
  incorrectCount: 'incorrect_count',
  status: 'status',
  cachedResponse: 'cached_response',
  cacheTimestamp: 'cache_timestamp',
};

export function partialWordToRow(updates: Partial<Word>): Row {
  const row: Row = {};

  for (const [key, col] of Object.entries(WORD_FIELD_MAP)) {
    if (!(key in updates)) continue;
    const k = key as keyof Word;
    const val = updates[k];

    // Date fields → ISO string
    if (val instanceof Date) {
      row[col] = val.toISOString();
    } else if (val === null || val === undefined) {
      row[col] = null;
    } else {
      row[col] = val;
    }
  }

  return row;
}

// ── AssessmentWord mappers ────────────────────────────────────────────────────

export function assessmentWordFromRow(row: Row): AssessmentWord {
  return {
    id: row.id as string,
    word: row.word as string,
    translation: row.translation as string,
    partOfSpeech: (row.part_of_speech as string) ?? '',
    batchId: (row.batch_id as string) ?? '',
    createdAt: new Date(row.created_at as string),
    status: row.status as AssessmentWord['status'],
  };
}

export function assessmentWordToRow(w: AssessmentWord, userId: string): Row {
  return {
    id: w.id,
    user_id: userId,
    word: w.word,
    translation: w.translation,
    part_of_speech: w.partOfSpeech,
    batch_id: w.batchId,
    created_at: w.createdAt.toISOString(),
    status: w.status,
  };
}
