import { useState } from 'react';
import { SearchBar, WordCard, SentenceCard, TextCard } from '@/components/dictionary';
import { vocabularyStorage } from '@/lib/storage';
import { useOnlineStatus, useSearchHistory } from '@/hooks';
import { classifyInput } from '@/lib/utils';
import { lookupWordStream, translateSentenceStream, translateTextStream } from '@/lib/openai';
import type { PartialWordData } from '@/lib/openai';
import type { Language, SentenceTranslationResponse, TextTranslationResponse } from '@/types';
import type { InputType } from '@/lib/utils';

export function DictionaryView() {
  const [inputType, setInputType] = useState<InputType | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState<Language>('de');

  // Shared
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<Error | null>(null);
  const [addedEntries, setAddedEntries] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [addNotice, setAddNotice] = useState<string | null>(null);

  // Word streaming state
  const [partialWordData, setPartialWordData] = useState<PartialWordData | null>(null);

  // Sentence streaming state
  const [partialSentenceData, setPartialSentenceData] = useState<SentenceTranslationResponse | null>(null);

  // Text streaming state
  const [textResult, setTextResult] = useState<TextTranslationResponse | null>(null);
  const [streamingOriginal, setStreamingOriginal] = useState<string | null>(null);
  const [streamingTranslation, setStreamingTranslation] = useState<string>('');

  const isOnline = useOnlineStatus();
  const { history, addToHistory, clearHistory } = useSearchHistory();
  const [externalQuery, setExternalQuery] = useState<string | undefined>();

  const detectLanguage = (text: string): Language => {
    // Umlauts / ß are definitive German markers
    if (/[äöüßÄÖÜ]/.test(text)) return 'de';

    // Common German function words — reliable signal even without umlauts
    // e.g. "Das ist ein Bett" contains "das", "ist", "ein" → German
    const germanWords = /\b(das|ein|eine|einer|eines|einem|einen|der|die|den|dem|des|ich|du|er|sie|es|wir|ihr|nicht|auch|noch|schon|aber|wenn|dann|oder|und|bei|mit|für|von|zu|an|auf|im|in|am|aus|nach|als|wie|was|wer|wo|wann|ist|war|wird|hat|sein|werden|kann|muss|soll|will|doch|ja|nein|hier|dort|jetzt|sehr|viel|alle|viele|mehr|so|nun|bereits|kein|keine|nur|bis|seit|um|durch|über|unter|vor|zwischen|man|gibt|geht|macht|kommt|sagt|sind|waren|wurde|bitte|danke|bitte|leider|natürlich|eigentlich|trotzdem|obwohl|weil|dass|ob)\b/i;
    if (germanWords.test(text)) return 'de';

    // German word-formation patterns
    const germanEndings = /(ung|keit|heit|lich|isch|schaft|chen|lein|ieren|burg|stein|berg)(\s|$)/i;
    const germanPrefixes = /^(sch|pf|kn|gn|zw)/i;
    if (germanEndings.test(text) || germanPrefixes.test(text)) return 'de';

    return 'en';
  };

  const handleHistorySelect = (item: string) => {
    setExternalQuery(item);
    handleSearch(item);
  };

  const handleSearch = async (query: string) => {
    addToHistory(query);
    const lang = detectLanguage(query);
    const type = classifyInput(query);

    setSourceLanguage(lang);
    setInputType(type);
    setPartialWordData(null);
    setPartialSentenceData(null);
    setTextResult(null);
    setStreamingOriginal(null);
    setStreamingTranslation('');
    setTranslationError(null);
    setAddNotice(null);
    setIsTranslating(true);

    try {
      if (type === 'word') {
        // Show card on first partial (word field arrives within ~200ms)
        let firstPartial = true;
        const result = await lookupWordStream(query, lang, (partial) => {
          if (firstPartial) { setIsTranslating(false); firstPartial = false; }
          setPartialWordData(partial);
        });
        setPartialWordData(result);
        setIsTranslating(false);

      } else if (type === 'sentence') {
        // Card appears instantly with original; variants stream in one by one
        setIsTranslating(false);
        const result = await translateSentenceStream(query, lang, (partial) => {
          setPartialSentenceData(partial);
        });
        setPartialSentenceData(result);

      } else {
        // Text mode: show card immediately, translation streams in
        setIsTranslating(false);
        setStreamingOriginal(query);
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
    if (!partialWordData?.translation) return;
    await handleAddToVocabulary(partialWordData.word, partialWordData.translation);
  };

  const handleAddSentence = async () => {
    if (!partialSentenceData) return;
    const standardVariant = partialSentenceData.variants.find((v) => v.style === 'standard');
    const translation = standardVariant
      ? [standardVariant.text]
      : partialSentenceData.variants.map((v) => v.text);
    await handleAddToVocabulary(partialSentenceData.original, translation);
  };

  const isLoading = isTranslating;
  const error = translationError;
  const isWordStreaming = inputType === 'word' && !!partialWordData && !partialWordData.synonyms;
  const isSentenceStreaming = inputType === 'sentence' && !!partialSentenceData && partialSentenceData.variants.length < 3;

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
        hasResult={!!(partialWordData || partialSentenceData || textResult || streamingOriginal)}
        externalQuery={externalQuery}
      />

      {/* Search History — shown only on empty/landing state */}
      {!partialWordData && !partialSentenceData && !textResult && !streamingOriginal && !isLoading && !error && history.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest">Verlauf</p>
            <button
              onClick={clearHistory}
              className="text-[11px] text-warm-400 hover:text-warm-700 transition-colors"
            >
              Löschen
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 10).map((item) => (
              <button
                key={item}
                onClick={() => handleHistorySelect(item)}
                className="flex items-center gap-1.5 bg-warm-100 hover:bg-warm-200 text-warm-700 rounded-xl px-3 py-1.5 text-sm transition-colors text-left"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-warm-400 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="truncate max-w-[220px]">{item}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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

      {/* Loading State — only shows for word mode before first token */}
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
          <p className="text-warm-400 text-sm tracking-wide">Wird nachgeschlagen…</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="p-6 bg-[#f0d4d4] border border-[#d9a8a8] rounded-xl text-center">
          <p className="text-[#7c2828] font-medium mb-1">Fehler beim Nachschlagen</p>
          <p className="text-sm text-warm-700">{error.message}</p>
        </div>
      )}

      {/* Word Result — appears progressively as fields stream in */}
      {inputType === 'word' && partialWordData && !isLoading && !error && (
        <WordCard
          wordData={partialWordData}
          onAddToVocabulary={handleAddWord}
          isAdding={isAdding}
          alreadyAdded={addedEntries.has(partialWordData.word.toLowerCase())}
          isStreaming={isWordStreaming}
        />
      )}

      {/* Sentence Result — original appears instantly, variants stream in */}
      {inputType === 'sentence' && partialSentenceData && !isLoading && !error && (
        <SentenceCard
          data={partialSentenceData}
          onAddToVocabulary={handleAddSentence}
          isAdding={isAdding}
          alreadyAdded={addedEntries.has(partialSentenceData.original)}
          isStreaming={isSentenceStreaming}
        />
      )}

      {/* Text Result — translation streams in word by word */}
      {inputType === 'text' && !error && (streamingOriginal || textResult) && (
        <TextCard
          data={textResult ?? { original: streamingOriginal!, translation: streamingTranslation }}
          isStreaming={!!streamingOriginal}
        />
      )}
    </div>
  );
}
