import { useState, useEffect } from 'react';
import { vocabularyStorage } from '@/lib/storage';
import { Spinner } from '@/components/ui';
import type { Word } from '@/types';

export function VocabularyListView() {
  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'learning' | 'mastered' | 'difficult'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDeleteConfirm = async (id: string) => {
    await vocabularyStorage.deleteWord(id);
    setWords((prev) => prev.filter((w) => w.id !== id));
    setDeletingId(null);
  };

  const statusLabel = (status: Word['status']) => {
    switch (status) {
      case 'learning': return 'Lernend';
      case 'mastered': return 'Gemeistert';
      case 'difficult': return 'Schwierig';
    }
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-normal text-3xl text-warm-900 mb-1">Bibliothek</h1>
        <p className="text-warm-500 text-sm">
          {words.length} {words.length === 1 ? 'Wort' : 'Wörter'} gespeichert
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
        {([['all', 'Alle'], ['learning', 'Lernend'], ['mastered', 'Gemeistert'], ['difficult', 'Schwierig']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors touch-manipulation shrink-0 ${
              filter === key
                ? 'bg-warm-900 text-warm-50'
                : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
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
        <div className="py-16 text-center space-y-2">
          <p className="font-display font-normal text-2xl text-warm-300">
            Noch keine Vokabeln
          </p>
          <p className="text-sm text-warm-400">
            Schlage Wörter nach und füge sie mit dem Button hinzu
          </p>
        </div>
      )}

      {/* Word List */}
      {!isLoading && words.length > 0 && (
        <div className="space-y-3">
          {words.map((word) => (
            <div key={word.id}>
              <div className="card p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-warm-900 truncate">{word.word}</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-warm-100 text-warm-600">
                      {statusLabel(word.status)}
                    </span>
                  </div>
                  <p className="text-warm-500 text-sm truncate">
                    {word.translation.join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => setDeletingId(deletingId === word.id ? null : word.id)}
                  className="text-warm-300 hover:text-warm-900 transition-colors p-3 -mr-1 shrink-0 touch-manipulation"
                  title="Löschen"
                  aria-label="Wort löschen"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="1" y1="1" x2="13" y2="13" />
                    <line x1="13" y1="1" x2="1" y2="13" />
                  </svg>
                </button>
              </div>
              {deletingId === word.id && (
                <div className="bg-warm-100 rounded-b-xl px-4 py-3 flex items-center justify-between -mt-1">
                  <p className="text-sm text-warm-700">Wort wirklich löschen?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeletingId(null)}
                      className="text-sm text-warm-500 hover:text-warm-700 px-3 py-1"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => handleDeleteConfirm(word.id)}
                      className="text-sm text-warm-50 bg-warm-900 hover:bg-warm-700 px-3 py-1 rounded-lg"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
