import { useState } from 'react';
import { SearchBar, WordCard } from '@/components/dictionary';
import { Spinner } from '@/components/ui';
import { useWordLookup } from './hooks';
import { vocabularyStorage } from '@/lib/storage';
import { useOnlineStatus } from '@/hooks';
import type { Language } from '@/types';

export function DictionaryView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState<Language>('de');
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  const isOnline = useOnlineStatus();

  // Word lookup query
  const { data: wordData, isLoading, error } = useWordLookup({
    word: searchQuery,
    sourceLanguage,
    enabled: isOnline && searchQuery.length > 0,
  });

  const detectLanguage = (text: string): Language => {
    if (/[äöüßÄÖÜ]/.test(text)) return 'de';
    const germanPatterns = /^(sch|pf|kn|gn|zw|ch|ei|ie|au|eu|äu|st|sp)/i;
    const germanEndings = /(ung|keit|heit|lich|isch|schaft|chen|lein|ieren|burg|stein|berg)$/i;
    if (germanPatterns.test(text) || germanEndings.test(text)) return 'de';
    return 'en';
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSourceLanguage(detectLanguage(query));
  };

  const handleAddToVocabulary = async () => {
    if (!wordData) return;

    setIsAdding(true);
    try {
      // Check if word already exists
      const exists = await vocabularyStorage.wordExists(
        wordData.word,
        sourceLanguage
      );

      if (exists) {
        alert('Dieses Wort ist bereits in deinem Vokabular!');
        setAddedWords((prev) => new Set(prev).add(wordData.word.toLowerCase()));
        return;
      }

      // Add word to vocabulary
      await vocabularyStorage.addWord({
        word: wordData.word,
        language: sourceLanguage,
        translation: wordData.translation,
        definition: wordData.definition,
        partOfSpeech: wordData.partOfSpeech,
        ipa: wordData.ipa,
        examples: wordData.examples,
        synonyms: wordData.synonyms,
        relatedWords: wordData.relatedWords,
        usageHints: wordData.usageHints,
        source: 'user-added',
      });

      setAddedWords((prev) => new Set(prev).add(wordData.word.toLowerCase()));
      alert('✅ Wort erfolgreich hinzugefügt!');
    } catch (error) {
      console.error('Error adding word:', error);
      alert('❌ Fehler beim Hinzufügen des Wortes.');
    } finally {
      setIsAdding(false);
    }
  };

  const isWordAdded = wordData
    ? addedWords.has(wordData.word.toLowerCase())
    : false;

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Wörterbuch</h1>
        <p className="text-gray-600">
          Suche nach deutschen oder englischen Wörtern
        </p>
      </div>

      {/* Search Bar */}
      <SearchBar
        onSearch={handleSearch}
        placeholder="Deutsch oder Englisch eingeben..."
        disabled={!isOnline}
      />

      {/* Offline Notice */}
      {!isOnline && (
        <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg text-center">
          <p className="text-gray-700">
            📡 Du bist offline. Die Wortsuche benötigt eine Internetverbindung.
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Wort wird nachgeschlagen...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 bg-error-light border border-error rounded-lg text-center">
          <p className="text-error font-semibold mb-2">
            ❌ Fehler beim Nachschlagen
          </p>
          <p className="text-sm text-gray-700">
            {error.message || 'Ein unbekannter Fehler ist aufgetreten.'}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Stelle sicher, dass dein OpenAI API-Schlüssel korrekt konfiguriert
            ist.
          </p>
        </div>
      )}

      {/* Word Result */}
      {wordData && !isLoading && !error && (
        <WordCard
          wordData={wordData}
          onAddToVocabulary={handleAddToVocabulary}
          isAdding={isAdding}
          alreadyAdded={isWordAdded}
        />
      )}

      {/* Empty State */}
      {!searchQuery && !isLoading && !error && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-6xl mb-4">📖</p>
          <p className="text-lg">
            Gib ein Wort ein, um es nachzuschlagen
          </p>
        </div>
      )}
    </div>
  );
}
