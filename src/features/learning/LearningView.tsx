import { useState, useCallback } from 'react';
import { vocabularyStorage } from '@/lib/storage';
import { generateLearningCards, generateCuratedVocabulary } from '@/lib/openai';
import type { LearningCard } from '@/lib/openai/client';
import { Spinner } from '@/components/ui';

type Phase = 'setup' | 'loading' | 'learning' | 'summary';

interface FlashCard extends LearningCard {
  known: boolean | null;
}

export function LearningView() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [wordCount, setWordCount] = useState<20 | 25 | 30>(20);
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cards still in the pool (not yet known)
  const activeCards = cards.filter((c) => c.known !== true);
  const knownCount = cards.filter((c) => c.known === true).length;
  const currentCard = activeCards.length > 0 ? activeCards[currentIndex % activeCards.length] : null;

  const startSession = useCallback(async () => {
    setPhase('loading');
    setError(null);

    try {
      // Get user's saved words
      const savedWords = await vocabularyStorage.getAllWords();
      const savedWordNames = savedWords.map((w) => w.word);

      // Determine how many from each pool
      const userWordCount = Math.min(savedWords.length, Math.floor(wordCount * 0.5));
      const curatedCount = wordCount - userWordCount;

      // Pick random user words
      const shuffledUser = [...savedWordNames].sort(() => Math.random() - 0.5);
      const selectedUserWords = shuffledUser.slice(0, userWordCount);

      // Generate curated C1 words
      let curatedWords: string[] = [];
      if (curatedCount > 0) {
        const topics = ['academic', 'business', 'everyday', 'science', 'culture'];
        const result = await generateCuratedVocabulary('C1', topics, curatedCount, savedWordNames);
        curatedWords = result.words.slice(0, curatedCount);
      }

      const allWords = [...selectedUserWords, ...curatedWords].sort(() => Math.random() - 0.5);

      // Generate learning cards in batches of 10
      const allCards: LearningCard[] = [];
      for (let i = 0; i < allWords.length; i += 10) {
        const batch = allWords.slice(i, i + 10);
        const batchCards = await generateLearningCards(batch);
        allCards.push(...batchCards);
      }

      setCards(allCards.map((c) => ({ ...c, known: null })));
      setCurrentIndex(0);
      setRevealed(false);
      setPhase('learning');
    } catch (err) {
      console.error('Error starting session:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Starten der Lernsession');
      setPhase('setup');
    }
  }, [wordCount]);

  const handleAnswer = (knew: boolean) => {
    if (!currentCard) return;

    const updatedCards = cards.map((c) =>
      c.word === currentCard.word ? { ...c, known: knew ? true : false } : c
    );
    setCards(updatedCards);
    setRevealed(false);

    // Check if session is done
    const remaining = updatedCards.filter((c) => c.known !== true);
    if (remaining.length === 0) {
      setPhase('summary');
      return;
    }

    // Move to next card in remaining pool
    setCurrentIndex((prev) => (prev + 1) % remaining.length);
  };

  // Render bold text from **word**
  const renderBold = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i} className="font-bold text-black">{part}</strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  // SETUP PHASE
  if (phase === 'setup') {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Lernmodus</h1>
          <p className="text-gray-600">Wähle die Anzahl der Vokabeln</p>
        </div>

        <div className="flex justify-center gap-3">
          {([20, 25, 30] as const).map((count) => (
            <button
              key={count}
              onClick={() => setWordCount(count)}
              className={`w-20 h-20 rounded-2xl text-2xl font-bold transition-all ${
                wordCount === count
                  ? 'bg-black text-white scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {count}
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-gray-500">
          Mix aus deinen gespeicherten Vokabeln und neuen C1-Wörtern
        </p>

        {error && (
          <div className="p-4 bg-error-light border border-error rounded-lg text-center">
            <p className="text-error text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={startSession}
          className="btn btn-primary w-full text-lg"
        >
          Lernen starten
        </button>
      </div>
    );
  }

  // LOADING PHASE
  if (phase === 'loading') {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner size="lg" />
          <p className="mt-6 text-gray-600 text-lg">Lernkarten werden erstellt...</p>
          <p className="mt-2 text-gray-400 text-sm">Dies kann einen Moment dauern</p>
        </div>
      </div>
    );
  }

  // SUMMARY PHASE
  if (phase === 'summary') {
    const total = cards.length;
    const percentage = Math.round((knownCount / total) * 100);

    return (
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-8">
        <div className="text-center">
          <p className="text-6xl mb-4">
            {percentage >= 80 ? '🎉' : percentage >= 50 ? '💪' : '📚'}
          </p>
          <h1 className="text-3xl font-bold mb-2">Session beendet!</h1>
          <p className="text-gray-600">
            {knownCount}/{total} Vokabeln gemeistert
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-success h-4 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="card p-4 border border-gray-200">
            <p className="text-3xl font-bold text-success">{knownCount}</p>
            <p className="text-sm text-gray-600">Gewusst</p>
          </div>
          <div className="card p-4 border border-gray-200">
            <p className="text-3xl font-bold text-error">{total - knownCount}</p>
            <p className="text-sm text-gray-600">Nicht gewusst</p>
          </div>
        </div>

        {/* Words overview */}
        <div className="space-y-2">
          <h2 className="font-semibold text-gray-700">Übersicht</h2>
          {cards.map((card) => (
            <div
              key={card.word}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <span className="font-medium">{card.word}</span>
                <span className="text-gray-500 text-sm ml-2">— {card.translation}</span>
              </div>
              <span className={card.known ? 'text-success' : 'text-error'}>
                {card.known ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            setCards([]);
            setPhase('setup');
          }}
          className="btn btn-primary w-full text-lg"
        >
          Neue Session starten
        </button>
      </div>
    );
  }

  // LEARNING PHASE
  if (!currentCard) {
    setPhase('summary');
    return null;
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>{knownCount}/{cards.length} gemeistert</span>
          <span>{activeCards.length} verbleibend</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-black h-2 rounded-full transition-all duration-300"
            style={{ width: `${(knownCount / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="card border border-gray-200 overflow-hidden">
        {/* Example sentence */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-500 mb-2 font-medium">Beispielsatz</p>
          <p className="text-lg leading-relaxed">{renderBold(currentCard.exampleSentence)}</p>
        </div>

        {/* Word + Synonym */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Wort</p>
            <p className="text-2xl font-bold">{currentCard.word}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Synonyme</p>
            <p className="text-gray-700">{currentCard.synonyms.join(', ')}</p>
          </div>

          {/* Revealed section */}
          {revealed && (
            <div className="animate-fade-in space-y-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-500 mb-1">Übersetzung</p>
                <p className="text-xl font-semibold">{currentCard.translation}</p>
              </div>
              {currentCard.additionalExamples?.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Weitere Beispiele</p>
                  <div className="space-y-2">
                    {currentCard.additionalExamples.map((ex, i) => (
                      <p key={i} className="text-gray-700 text-sm p-2 bg-gray-50 rounded">
                        {ex}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="btn btn-primary w-full text-lg"
        >
          Antwort zeigen
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => handleAnswer(false)}
            className="btn btn-error flex-1 text-lg"
          >
            Nicht gewusst
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="btn btn-success flex-1 text-lg"
          >
            Gewusst
          </button>
        </div>
      )}
    </div>
  );
}
