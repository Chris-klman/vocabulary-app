import { useState, useCallback } from 'react';
import { vocabularyStorage } from '@/lib/storage';
import { generateLearningCards, generateCuratedVocabulary } from '@/lib/openai';
import type { LearningCard } from '@/lib/openai/client';
import { WordPopup } from '@/components/ui';

type Phase = 'setup' | 'loading' | 'learning' | 'summary';
type Direction = 'en-to-de' | 'de-to-en';

interface FlashCard extends LearningCard {
  known: boolean | null;
}

export function LearningView() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [wordCount, setWordCount] = useState<20 | 25 | 30>(20);
  const [direction, setDirection] = useState<Direction>('en-to-de');
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState('');

  const activeCards = cards.filter((c) => c.known !== true);
  const knownCount = cards.filter((c) => c.known === true).length;
  const currentCard = activeCards.length > 0 ? activeCards[currentIndex % activeCards.length] : null;

  const startSession = useCallback(async () => {
    setPhase('loading');
    setError(null);
    setLoadingProgress(0);

    try {
      setLoadingStep('Vokabeln werden zusammengestellt...');
      setLoadingProgress(10);

      const savedWords = await vocabularyStorage.getAllWords();
      const savedWordNames = savedWords.map((w) => w.word);

      const userWordCount = Math.min(savedWords.length, Math.floor(wordCount * 0.5));
      const curatedCount = wordCount - userWordCount;

      const shuffledUser = [...savedWordNames].sort(() => Math.random() - 0.5);
      const selectedUserWords = shuffledUser.slice(0, userWordCount);

      setLoadingProgress(20);
      setLoadingStep('Neue C1-Vokabeln werden generiert...');

      let curatedWords: string[] = [];
      if (curatedCount > 0) {
        const topics = ['academic', 'business', 'everyday', 'science', 'culture'];
        const result = await generateCuratedVocabulary('C1', topics, curatedCount, savedWordNames);
        curatedWords = result.words.slice(0, curatedCount);
      }

      setLoadingProgress(40);

      const allWords = [...selectedUserWords, ...curatedWords].sort(() => Math.random() - 0.5);

      const allCards: LearningCard[] = [];
      const totalBatches = Math.ceil(allWords.length / 10);

      for (let i = 0; i < allWords.length; i += 10) {
        const batchNum = Math.floor(i / 10) + 1;
        setLoadingStep(`Lernkarten werden erstellt (${batchNum}/${totalBatches})...`);

        const batch = allWords.slice(i, i + 10);
        const batchCards = await generateLearningCards(batch);
        allCards.push(...batchCards);

        setLoadingProgress(40 + Math.round((batchNum / totalBatches) * 55));
      }

      setLoadingProgress(100);
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

  const handleAnswer = async (knew: boolean) => {
    if (!currentCard) return;

    const updatedCards = cards.map((c) =>
      c.word === currentCard.word ? { ...c, known: knew ? true : false } : c
    );
    setCards(updatedCards);
    setRevealed(false);

    // Auto-save unknown words to vocabulary
    if (!knew) {
      try {
        const exists = await vocabularyStorage.wordExists(currentCard.word, 'en');
        if (!exists) {
          await vocabularyStorage.addWord({
            word: currentCard.word,
            language: 'en',
            translation: [currentCard.translation],
            definition: '',
            partOfSpeech: [],
            ipa: '',
            examples: currentCard.additionalExamples?.map((ex) => ({
              english: ex,
              german: '',
            })) ?? [],
            synonyms: currentCard.synonyms ?? [],
            relatedWords: [],
            usageHints: [],
            source: 'user-added',
          });
        }
      } catch (err) {
        console.error('Error auto-saving word:', err);
      }
    }

    const remaining = updatedCards.filter((c) => c.known !== true);
    if (remaining.length === 0) {
      setPhase('summary');
      return;
    }

    setCurrentIndex((prev) => (prev + 1) % remaining.length);
  };

  const renderBoldClickable = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-black">{part}</strong>;
      }
      return <WordPopup key={i} text={part} />;
    });
  };

  // SETUP PHASE
  if (phase === 'setup') {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Lernmodus</h1>
          <p className="text-gray-600">Konfiguriere deine Lernsession</p>
        </div>

        {/* Direction Toggle */}
        <div>
          <p className="text-sm text-gray-600 mb-3 text-center font-medium">Abfragerichtung</p>
          <div className="flex gap-2">
            <button
              onClick={() => setDirection('en-to-de')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                direction === 'en-to-de'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Englisch → Deutsch
            </button>
            <button
              onClick={() => setDirection('de-to-en')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                direction === 'de-to-en'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Deutsch → Englisch
            </button>
          </div>
        </div>

        {/* Word Count */}
        <div>
          <p className="text-sm text-gray-600 mb-3 text-center font-medium">Anzahl Vokabeln</p>
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
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="text-5xl animate-pulse">🎯</div>
          <div className="w-full max-w-sm space-y-3">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-black h-3 rounded-full transition-all duration-500"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-600">{loadingStep}</p>
            <p className="text-center text-xs text-gray-400">{loadingProgress}%</p>
          </div>
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

        <p className="text-center text-xs text-gray-400">
          Nicht gewusste Vokabeln wurden automatisch in deine Bibliothek gespeichert.
        </p>

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

  const showWord = direction === 'en-to-de' ? currentCard.word : currentCard.translation;
  const revealWord = direction === 'en-to-de' ? currentCard.translation : currentCard.word;

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
          <p className="text-lg leading-relaxed">{renderBoldClickable(currentCard.exampleSentence)}</p>
        </div>

        {/* Word + Synonym */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">
              {direction === 'en-to-de' ? 'Englisch' : 'Deutsch'}
            </p>
            <p className="text-2xl font-bold">{showWord}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Synonyme</p>
            <p className="text-gray-700">{currentCard.synonyms.join(', ')}</p>
          </div>

          {/* Revealed section */}
          {revealed && (
            <div className="animate-fade-in space-y-4 pt-4 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-500 mb-1">
                  {direction === 'en-to-de' ? 'Deutsch' : 'Englisch'}
                </p>
                <p className="text-xl font-semibold">{revealWord}</p>
              </div>
              {currentCard.additionalExamples?.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Weitere Beispiele</p>
                  <div className="space-y-2">
                    {currentCard.additionalExamples.map((ex, i) => (
                      <p key={i} className="text-gray-700 text-sm p-2 bg-gray-50 rounded">
                        <WordPopup text={ex} />
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
