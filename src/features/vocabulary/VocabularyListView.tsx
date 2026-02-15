import { useState, useEffect } from 'react';
import { vocabularyStorage } from '@/lib/storage';
import { Spinner } from '@/components/ui';
import type { Word } from '@/types';

export function VocabularyListView() {
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'learning' | 'mastered' | 'difficult'>('all');

  const loadWords = async () => {
    setIsLoading(true);
    try {
      const allWords = filter === 'all'
        ? await vocabularyStorage.getWordsSorted('dateAdded', 'desc')
        : await vocabularyStorage.getWordsByStatus(filter);
      setWords(allWords);
    } catch (error) {
      console.error('Error loading words:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWords();
  }, [filter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Wort wirklich löschen?')) return;
    await vocabularyStorage.deleteWord(id);
    setWords((prev) => prev.filter((w) => w.id !== id));
  };

  const statusLabel = (status: Word['status']) => {
    switch (status) {
      case 'learning': return 'Lernend';
      case 'mastered': return 'Gemeistert';
      case 'difficult': return 'Schwierig';
    }
  };

  const statusColor = (status: Word['status']) => {
    switch (status) {
      case 'learning': return 'bg-gray-100 text-gray-700';
      case 'mastered': return 'bg-success-light text-gray-800';
      case 'difficult': return 'bg-error-light text-gray-800';
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold mb-2">Meine Vokabeln</h1>
        <p className="text-gray-600">
          {words.length} {words.length === 1 ? 'Wort' : 'Wörter'} gespeichert
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {([['all', 'Alle'], ['learning', 'Lernend'], ['mastered', 'Gemeistert'], ['difficult', 'Schwierig']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === key
                ? 'bg-black text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && words.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-6xl mb-4">📚</p>
          <p className="text-lg mb-2">Noch keine Vokabeln gespeichert</p>
          <p className="text-sm text-gray-400">
            Schlage Wörter nach und füge sie mit dem Button hinzu
          </p>
        </div>
      )}

      {/* Word List */}
      {!isLoading && words.length > 0 && (
        <div className="space-y-3">
          {words.map((word) => (
            <div
              key={word.id}
              className="card p-4 flex items-center justify-between gap-3 border border-gray-200"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-lg truncate">{word.word}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${statusColor(word.status)}`}>
                    {statusLabel(word.status)}
                  </span>
                </div>
                <p className="text-gray-600 text-sm truncate">
                  {word.translation.join(', ')}
                </p>
              </div>
              <button
                onClick={() => handleDelete(word.id)}
                className="text-gray-400 hover:text-error transition-colors p-2 shrink-0"
                title="Löschen"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
