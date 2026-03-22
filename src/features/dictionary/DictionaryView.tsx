import { useState } from 'react';
import { SearchBar, WordCard, SentenceCard, TextCard } from '@/components/dictionary';
import { useWordLookup } from './hooks';
import { vocabularyStorage } from '@/lib/storage';
import { useOnlineStatus } from '@/hooks';
import { classifyInput } from '@/lib/utils';
import { translateSentence, translateTextStream } from '@/lib/openai';
import type { Language } from '@/types';
import type { InputType } from '@/lib/utils';
import type { SentenceTranslationResponse, TextTranslationResponse } from '@/types';

export function DictionaryView() {
  const [inputType, setInputType] = useState<InputType | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState<Language>('de');

  // Word mode
  const [wordQuery, setWordQuery] = useState('');
  const [addedEntries, setAddedEntries] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [addNotice, setAddNotice] = useState<string | null>(null);

  // Sentence / text mode
  const [sentenceResult, setSentenceResult] = useState<SentenceTranslationResponse | null>(null);
  const [textResult, setTextResult] = useState<TextTranslationResponse | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<Error | null>(null);

  // Text streaming state
  const [streamingOriginal, setStreamingOriginal] = useState<string | null>(null);
  const [streamingTranslation, setStreamingTranslation] = useState<string>('');

  const isOnline = useOnlineStatus();

  const { data: wordData, isLoading: isWordLoading, error: wordError } = useWordLookup({
    word: wordQuery,
    sourceLanguage,
    enabled: isOnline && wordQuery.length > 0 && inputType === 'word',
  });

  const detectLanguage = (text: string): Language => {
    if (/[äöüßÄÖÜ]/.test(text)) return 'de';
    const germanPatterns = /^(sch|pf|kn|gn|zw|ch|ei|ie|au|eu|äu|st|sp)/i;
    const germanEndings = /(ung|keit|heit|lich|isch|schaft|chen|lein|ieren|burg|stein|berg)$/i;
    if (germanPatterns.test(text) || germanEndings.test(text)) return 'de';
    return 'en';
  };

  const handleSearch = async (query: string) => {
    const lang = detectLanguage(query);
    const type = classifyInput(query);

    setSourceLanguage(lang);
    setInputType(type);
    setSentenceResult(null);
    setTextResult(null);
    setStreamingOriginal(null);
    setStreamingTranslation('');
    setTranslationError(null);
    setAddNotice(null);

    if (type === 'word') {
      setWordQuery(query);
    } else {
      setWordQuery('');
      setIsTranslating(true);
      try {
        if (type === 'sentence') {
          const result = await translateSentence(query, lang);
          setSentenceResult(result);
          setIsTranslating(false);
        } else {
          // Text mode: start streaming immediately — hide spinner, show live card
          setIsTranslating(false);
          setStreamingOriginal(query);
          setStreamingTranslation('');
          const result = await translateTextStream(query, lang, (partial) => {
            setStreamingTranslation(partial);
          });
          setTextResult(result);
          setStreamingOriginal(null);
          setStreamingTranslation('');
        }
      } catch (err) {
        setIsTranslating(false);
        setStreamingOriginal(null);
        setStreamingTranslation('');
        setTranslationError(err instanceof Error ? err : new Error('Unbekannter Fehler'));
      }
    }
  };

  const handleAddToVocabulary = async (entry: string, translation: string[]) => {
    setIsAdding(true);
    setAddNotice(null);
    try {
      const exists = await vocabularyStorage.wordExists(entry, sourceLanguage);
      if (exists) {
        setAddedEntries((prev) => new Set(prev).add(entry));
        setAddNotice('Bereits in der Bibliothek gespeichert.');
        return;
      }

      await vocabularyStorage.addWord({
        word: entry,
        language: sourceLanguage,
        translation,
        definition: '',
        partOfSpeech: [],
        ipa: '',
        examples: [],
        synonyms: [],
        relatedWords: [],
        usageHints: [],
        source: 'user-added',
      });

      setAddedEntries((prev) => new Set(prev).add(entry));
      setAddNotice('Zur Bibliothek hinzugefügt.');
    } catch (error) {
      console.error('Error adding entry:', error);
      setAddNotice('Fehler beim Hinzufügen. Bitte erneut versuchen.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddWord = async () => {
    if (!wordData) return;
    await handleAddToVocabulary(wordData.word, wordData.translation);
  };

  const handleAddSentence = async () => {
    if (!sentenceResult) return;
    const standardVariant = sentenceResult.variants.find((v) => v.style === 'standard');
    const translation = standardVariant ? [standardVariant.text] : sentenceResult.variants.map((v) => v.text);
    await handleAddToVocabulary(sentenceResult.original, translation);
  };

  const isLoading = isWordLoading || isTranslating;
  const error = wordError || translationError;
  const isSearched = inputType !== null && (wordQuery || sentenceResult || textResult || isTranslating || streamingOriginal);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="mb-2">
        <h1 className="font-display font-normal text-3xl text-warm-900 mb-1">Nachschlagen</h1>
        <p className="text-warm-500 text-sm">Schlage Wort, Satz oder ganzen Text nach</p>
      </div>

      {/* Search Bar */}
      <SearchBar
        onSearch={handleSearch}
        placeholder="Eingeben und Enter drücken…"
        disabled={!isOnline}
      />

      {/* Add notice */}
      {addNotice && (
        <p className="text-sm text-warm-500 text-center animate-fade-in">{addNotice}</p>
      )}

      {/* Offline Notice */}
      {!isOnline && (
        <div className="p-4 bg-warm-100 border border-warm-200 rounded-xl text-center">
          <p className="text-warm-700 text-sm">
            Offline — die Suche benötigt eine Internetverbindung.
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-warm-400"
                style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
          <p className="text-warm-400 text-sm tracking-wide">
            {inputType === 'word' ? 'Wird nachgeschlagen…' : 'Wird übersetzt…'}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-6 bg-[#f0d4d4] border border-[#d9a8a8] rounded-xl text-center">
          <p className="text-[#7c2828] font-medium mb-1">Fehler beim Nachschlagen</p>
          <p className="text-sm text-warm-700">{error.message}</p>
        </div>
      )}

      {/* Word Result */}
      {inputType === 'word' && wordData && !isLoading && !error && (
        <WordCard
          wordData={wordData}
          onAddToVocabulary={handleAddWord}
          isAdding={isAdding}
          alreadyAdded={addedEntries.has(wordData.word.toLowerCase())}
        />
      )}

      {/* Sentence Result */}
      {inputType === 'sentence' && sentenceResult && !isLoading && !error && (
        <SentenceCard
          data={sentenceResult}
          onAddToVocabulary={handleAddSentence}
          isAdding={isAdding}
          alreadyAdded={addedEntries.has(sentenceResult.original)}
        />
      )}

      {/* Text Result (streaming while translating, final when done) */}
      {inputType === 'text' && !error && (streamingOriginal || textResult) && (
        <TextCard
          data={textResult ?? { original: streamingOriginal!, translation: streamingTranslation }}
          isStreaming={!!streamingOriginal}
        />
      )}

    </div>
  );
}
