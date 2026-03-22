// OpenAI prompt templates

export function createDictionaryLookupPrompt(word: string, sourceLanguage: string): string {
  const targetLanguage = sourceLanguage === 'de' ? 'en' : 'de';
  const targetName = targetLanguage === 'en' ? 'English' : 'German';
  const sourceName = sourceLanguage === 'en' ? 'English' : 'German';

  return `You are a bilingual English-German dictionary for advanced learners (B2/C1 level).

The user has typed the ${sourceName} word "${word}" and wants its ${targetName} translation.

Return a JSON object with this EXACT structure (no text outside the JSON):
{
  "word": "${word}",
  "translation": ["primary ${targetName} translation", "alternative ${targetName} translation if applicable"],
  "definition": "Concise definition in ${targetName} of the translated ${targetName} word",
  "partOfSpeech": ["noun"],
  "ipa": "/pronunciation of the primary ${targetName} translation/",
  "examples": [
    {"english": "Natural English sentence using the word", "german": "Natürlicher deutscher Beispielsatz"},
    {"english": "Natural English sentence using the word", "german": "Natürlicher deutscher Beispielsatz"},
    {"english": "Natural English sentence using the word", "german": "Natürlicher deutscher Beispielsatz"}
  ],
  "synonyms": ["${targetName} synonym 1 of the translation", "${targetName} synonym 2", "${targetName} synonym 3"],
  "relatedWords": ["related ${targetName} word 1", "related ${targetName} word 2"],
  "usageHints": ["Formality or register note", "Regional or contextual note"]
}

CRITICAL — violating these rules makes the response useless:
- "translation" MUST contain ${targetName.toUpperCase()} words only — never ${sourceName} words
- "synonyms" MUST be ${targetName.toUpperCase()} synonyms of the TRANSLATED word, not of "${word}"
- "definition" MUST be written in ${targetName}
- "ipa" is the IPA of the primary ${targetName} translation
- Example sentences: always provide both English and German versions
- All arrays must have at least 2 elements`;
}

export function createCuratedVocabularyPrompt(
  level: 'B2' | 'C1',
  topics: string[],
  count: number,
  excludeWords: string[]
): string {
  return `Generate ${count} advanced English vocabulary words for ${level} level learners.

Focus on these topics: ${topics.join(', ')}

Exclude these words (user already knows them):
${excludeWords.join(', ')}

Requirements:
- Only ADVANCED vocabulary (${level} level)
- NO basic/elementary words (like go, run, house, etc.)
- Varied and useful for the specified topics
- Include mix of:
  - Academic vocabulary
  - Business/professional terms
  - Idiomatic expressions
  - Phrasal verbs
  - Sophisticated alternatives to common words

Return ONLY a JSON array of words (no explanations, no additional text):
["word1", "word2", "word3", ...]

Example output:
["contemplate", "mitigate", "scrutinize", "leverage", "paradigm"]`;
}

export function createLearningCardPrompt(words: string[]): string {
  return `You are an English vocabulary trainer for advanced learners (B2/C1 level).

Generate learning cards for these words: ${JSON.stringify(words)}

Return a JSON array with this EXACT structure (no additional text, only JSON):
[
  {
    "word": "the word",
    "exampleSentence": "A natural English sentence with the word used in context. Use **word** to bold the target word.",
    "exampleSentenceDe": "Der gleiche Satz auf Deutsch, mit dem **übersetzten Wort** fett markiert.",
    "synonyms": ["English synonym1", "English synonym2"],
    "synonymsDe": ["Deutsches Synonym1", "Deutsches Synonym2"],
    "translation": "German translation",
    "additionalExamples": [
      "Another English example sentence using the word.",
      "A third English example sentence using the word."
    ]
  }
]

IMPORTANT:
- Example sentences must be natural, practical, and at C1 level
- Bold the target word in exampleSentence using **word**
- exampleSentenceDe must be the German translation of exampleSentence, with the German equivalent of the target word bolded using **word**
- synonyms: English synonyms of the word
- synonymsDe: German synonyms of the German translation
- Provide 2 synonyms minimum for both synonyms and synonymsDe
- Provide exactly 2 additional examples (in English)
- Translation should be the most common German translation`;
}

export function createAssessmentWordsPrompt(count: number, excludeWords: string[]): string {
  const exclusionNote = excludeWords.length > 0
    ? `\nDo NOT include any of these words (already known or in library):\n${excludeWords.slice(0, 200).join(', ')}`
    : '';

  return `Generate ${count} English vocabulary words for advanced German-English learners at C1 level.

Requirements:
- Genuinely useful in professional, academic, or everyday contexts at C1 level
- NOT too basic (avoid: go, big, house, run, good, time, think)
- NOT extremely rare, archaic, or overly specialized
- Single words only — no phrases, compound expressions, or proper nouns
- Good variety: include adjectives, verbs, nouns, and adverbs
- Words a university-educated person would encounter regularly
- No duplicates${exclusionNote}

Return ONLY a JSON array, no explanations:
[
  {"word": "meticulous", "translation": "akribisch, sorgfältig", "partOfSpeech": "adjective"},
  {"word": "alleviate", "translation": "lindern, mildern", "partOfSpeech": "verb"}
]

Return exactly ${count} items.`;
}

export function createSentenceTranslationPrompt(sentence: string, sourceLanguage: string): string {
  const targetLanguage = sourceLanguage === 'de' ? 'en' : 'de';
  const targetName = targetLanguage === 'de' ? 'German' : 'English';
  const sourceName = sourceLanguage === 'de' ? 'German' : 'English';

  return `You are an expert translator specializing in natural, idiomatic ${targetName} translations.

Translate the following ${sourceName} sentence into ${targetName} with three style variants.

Sentence: "${sentence}"

Return a JSON object with this EXACT structure (no text outside the JSON):
{
  "original": "${sentence}",
  "variants": [
    {"style": "standard",  "label": "Standard",           "text": "Natural everyday ${targetName} translation"},
    {"style": "formal",    "label": "Formell",             "text": "Formal / professional ${targetName} translation"},
    {"style": "informal",  "label": "Umgangssprachlich",   "text": "Casual / colloquial ${targetName} translation"}
  ]
}

CRITICAL — violating these rules makes the response useless:
- ALL three "text" values MUST be in ${targetName.toUpperCase()} — do NOT output ${sourceName} text
- The input is ${sourceName}; the output must be ${targetName}
- Each variant must feel natural and differ noticeably in register
- No explanations, no extra fields, only the JSON object`;
}

export function createTextTranslationPrompt(text: string, sourceLanguage: string): string {
  const targetLanguage = sourceLanguage === 'de' ? 'en' : 'de';
  const targetName = targetLanguage === 'de' ? 'German' : 'English';
  const sourceName = sourceLanguage === 'de' ? 'German' : 'English';

  return `You are an expert translator specializing in natural, flowing ${targetName} translations.

Translate the following ${sourceName} text into ${targetName}. Produce one single, high-quality translation that reads fluently and preserves the original meaning and tone.

Text: "${text}"

Return a JSON object with this EXACT structure (no text outside the JSON):
{
  "translation": "The complete, natural ${targetName} translation here",
  "original": "${text}"
}

CRITICAL — violating these rules makes the response useless:
- "translation" MUST be in ${targetName.toUpperCase()} — do NOT repeat the ${sourceName} text
- The input is ${sourceName}; the translation must be ${targetName}
- Single translation only, no variants
- Preserve paragraphs and formatting
- No explanations, only the JSON object`;
}

// Helper to extract JSON from OpenAI response
export function extractJSON(response: string): any {
  try {
    // First try to parse directly
    return JSON.parse(response);
  } catch {
    // If that fails, try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1].trim());
    }

    // Try to find JSON object/array in the text
    const objectMatch = response.match(/\{[\s\S]*\}/);
    const arrayMatch = response.match(/\[[\s\S]*\]/);

    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }

    throw new Error('Could not extract JSON from response');
  }
}
