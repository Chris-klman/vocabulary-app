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
