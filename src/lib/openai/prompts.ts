// OpenAI prompt templates

export function createDictionaryLookupPrompt(word: string, sourceLanguage: string): string {
  const targetLanguage = sourceLanguage === 'de' ? 'en' : 'de';

  return `You are a bilingual English-German dictionary for advanced learners (B2/C1 level).

${
  sourceLanguage === 'de'
    ? `The user has provided a GERMAN word and wants to learn its English translation.`
    : `The user has provided an ENGLISH word and wants to learn its German translation.`
}

Word to look up: "${word}"
Source language: ${sourceLanguage}
Target language: ${targetLanguage}

Return a JSON response with this EXACT structure (no additional text, only JSON):
{
  "word": "${word}",
  "translation": ["primary translation", "alternative translation if applicable"],
  "definition": "Clear English definition/explanation of the word",
  "partOfSpeech": ["noun", "verb"],
  "ipa": "/aɪˈpiːˈeɪ/",
  "examples": [
    {"english": "Example sentence 1 using the word", "german": "Beispielsatz 1 mit dem Wort"},
    {"english": "Example sentence 2 using the word", "german": "Beispielsatz 2 mit dem Wort"},
    {"english": "Example sentence 3 using the word", "german": "Beispielsatz 3 mit dem Wort"}
  ],
  "synonyms": ["synonym1", "synonym2", "synonym3"],
  "relatedWords": ["related1", "related2"],
  "usageHints": ["Context note 1 (e.g., 'Formal context')", "Context note 2 (e.g., 'British English')"]
}

IMPORTANT:
- Provide comprehensive, educational content suitable for B2/C1 learners
- Example sentences should be natural and practical
- Include IPA pronunciation for English words
- Usage hints should explain formality level, regional variations, or common mistakes
- Ensure all arrays have at least the minimum required elements`;
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

Translate this ${sourceName} sentence into ${targetName} with three different style variations.

Sentence: "${sentence}"

Return a JSON object with this EXACT structure (no additional text, only JSON):
{
  "original": "${sentence}",
  "variants": [
    {
      "style": "standard",
      "label": "Standard",
      "text": "Natural, everyday translation"
    },
    {
      "style": "formal",
      "label": "Formell",
      "text": "More formal / professional translation"
    },
    {
      "style": "informal",
      "label": "Umgangssprachlich",
      "text": "More casual / colloquial translation"
    }
  ]
}

IMPORTANT:
- All three translations must be in ${targetName}
- Each variant must feel natural and authentic for its register
- The variants should noticeably differ in tone while preserving the meaning
- No explanations, only the JSON object`;
}

export function createTextTranslationPrompt(text: string, sourceLanguage: string): string {
  const targetLanguage = sourceLanguage === 'de' ? 'en' : 'de';
  const targetName = targetLanguage === 'de' ? 'German' : 'English';
  const sourceName = sourceLanguage === 'de' ? 'German' : 'English';

  return `You are an expert translator specializing in natural, flowing ${targetName} translations.

Translate this ${sourceName} text into ${targetName}. Produce one single, high-quality translation that reads fluently and preserves the original meaning and tone.

Text: "${text}"

Return a JSON object with this EXACT structure (no additional text, only JSON):
{
  "original": "${text}",
  "translation": "The complete, natural ${targetName} translation here"
}

IMPORTANT:
- Single translation only — no variants, no alternatives
- Keep paragraphs and formatting intact
- The translation must sound natural and idiomatic in ${targetName}
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
