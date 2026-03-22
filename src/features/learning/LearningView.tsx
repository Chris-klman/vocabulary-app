import { useState, useCallback } from 'react';
import { vocabularyStorage } from '@/lib/storage';
import { generateLearningCards } from '@/lib/openai';
import type { LearningCard } from '@/lib/openai/client';
import { WordPopup, SpeakButton, Spinner } from '@/components/ui';
import { stripMarkdown } from '@/hooks';

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
  const [emptyLibrary, setEmptyLibrary] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState('');

  const activeCards = cards.filter((c) => c.known !== true);
  const knownCount = cards.filter((c) => c.known === true).length;
  const currentCard = activeCards.length > 0 ? activeCards[currentIndex % activeCards.length] : null;

  const startSession = useCallback(async () => {
    setPhase('loading');
    setError(null);
    setEmptyLibrary(false);
    setLoadingProgress(0);

    try {
      setLoadingStep('Vokabeln aus Bibliothek werden geladen...');
      setLoadingProgress(15);

      const savedWords = await vocabularyStorage.getAllWords();

      if (savedWords.length === 0) {
        setEmptyLibrary(true);
        setPhase('setup');
        return;
      }

      // Shuffle and cap to selected word count
      const shuffled = [...savedWords].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(wordCount, shuffled.length));
      const wordNames = selected.map((w) => w.word);

      setLoadingProgress(30);

      // Generate learning cards in batches of 10
      const allCards: LearningCard[] = [];
      const totalBatches = Math.ceil(wordNames.length / 10);

      for (let i = 0; i < wordNames.length; i += 10) {
        const batchNum = Math.floor(i / 10) + 1;
        setLoadingStep(`Lernkarten werden erstellt (${batchNum}/${totalBatches})...`);

        const batch = wordNames.slice(i, i + 10);
        const batchCards = await generateLearningCards(batch);
        allCards.push(...batchCards);

        setLoadingProgress(30 + Math.round((batchNum / totalBatches) * 65));
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

    // Auto-save unknown words to vocabulary if not already there
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
        return <strong key={i} className="font-bold text-warm-900">{part}</strong>;
      }
      return <WordPopup key={i} text={part} />;
    });
  };

  // SETUP PHASE
  if (phase === 'setup') {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="mb-6">
          <h1 className="font-display font-normal text-3xl text-warm-900 mb-1">Lernen</h1>
          <p className="text-warm-500 text-sm">Konfiguriere deine Lernsession</p>
        </div>

        {/* Empty library hint */}
        {emptyLibrary && (
          <div className="p-4 bg-warm-100 border border-warm-200 rounded-xl text-center space-y-1">
            <p className="font-medium text-warm-700">Deine Bibliothek ist leer</p>
            <p className="text-sm text-warm-600">
              Füge Wörter über das Wörterbuch hinzu oder stufe neue Wörter im Einstufen-Tab ein.
            </p>
          </div>
        )}

        {/* Direction Toggle */}
        <div>
          <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest mb-3">Abfragerichtung</p>
          <div className="flex gap-2">
            <button
              onClick={() => setDirection('en-to-de')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                direction === 'en-to-de'
                  ? 'bg-warm-900 text-warm-50'
                  : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
              }`}
            >
              Englisch → Deutsch
            </button>
            <button
              onClick={() => setDirection('de-to-en')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all text-sm ${
                direction === 'de-to-en'
                  ? 'bg-warm-900 text-warm-50'
                  : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
              }`}
            >
              Deutsch → Englisch
            </button>
          </div>
        </div>

        {/* Word Count */}
        <div>
          <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest mb-3">Anzahl Vokabeln</p>
          <div className="flex justify-center gap-3">
            {([20, 25, 30] as const).map((count) => (
              <button
                key={count}
                onClick={() => setWordCount(count)}
                className={`w-20 h-20 rounded-2xl text-2xl font-bold transition-all ${
                  wordCount === count
                    ? 'bg-warm-900 text-warm-50 scale-105'
                    : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-warm-400">
          Wörter aus deiner Bibliothek werden abgefragt
        </p>

        {error && (
          <div className="p-4 bg-[#f0d4d4] border border-[#d9a8a8] rounded-xl text-center">
            <p className="text-[#7c2828] text-sm">{error}</p>
          </div>
        )}

        <button onClick={startSession} className="btn btn-primary w-full text-lg">
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
          <Spinner size="lg" />
          <div className="w-full max-w-sm space-y-3">
            <div className="w-full bg-warm-200 rounded-full h-2">
              <div
                className="bg-warm-900 h-2 rounded-full transition-all duration-500"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-center text-sm text-warm-500">{loadingStep}</p>
            <p className="text-center text-xs text-warm-400">{loadingProgress}%</p>
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
      <div className="container max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-display font-normal text-3xl text-warm-900">Session beendet</h1>
          <p className="text-warm-500">{knownCount}/{total} Vokabeln gemeistert</p>
        </div>

        <div className="w-full bg-warm-200 rounded-full h-2">
          <div
            className="bg-warm-900 h-2 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-warm-50 rounded-2xl p-6">
            <p className="font-display font-normal text-3xl text-warm-900">{knownCount}</p>
            <p className="text-sm text-warm-500 mt-1">Gewusst</p>
          </div>
          <div className="bg-warm-50 rounded-2xl p-6">
            <p className="font-display font-normal text-3xl text-warm-900">{total - knownCount}</p>
            <p className="text-sm text-warm-500 mt-1">Nicht gewusst</p>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-[10px] font-medium text-warm-400 uppercase tracking-widest">Übersicht</h2>
          {cards.map((card) => (
            <div
              key={card.word}
              className="flex items-center justify-between p-3 bg-warm-50 rounded-xl"
            >
              <div>
                <span className="font-medium text-warm-900">{card.word}</span>
                <span className="text-warm-500 text-sm ml-2">— {card.translation}</span>
              </div>
              <span className={card.known ? 'text-warm-600' : 'text-warm-400'}>
                {card.known ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-warm-400">
          Nicht gewusste Vokabeln wurden automatisch in deine Bibliothek gespeichert.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => { setCards([]); setPhase('setup'); }}
            className="btn btn-outline flex-1"
          >
            Zurück
          </button>
          <button
            onClick={() => { startSession(); }}
            className="btn btn-primary flex-1"
          >
            Neue Runde
          </button>
        </div>
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
        <div className="flex justify-between text-sm text-warm-500">
          <span>{knownCount}/{cards.length} gemeistert</span>
          <span>{activeCards.length} verbleibend</span>
        </div>
        <div className="w-full bg-warm-200 rounded-full h-1">
          <div
            className="bg-warm-900 h-1 rounded-full transition-all duration-300"
            style={{ width: `${(knownCount / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div className="card overflow-hidden">
        {/* Example sentence */}
        <div className="p-6 bg-warm-50 border-b border-warm-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest">Beispielsatz</p>
            {/* Audio only for English sentence (en-to-de direction) */}
            {direction === 'en-to-de' && (
              <SpeakButton text={stripMarkdown(currentCard.exampleSentence)} />
            )}
          </div>
          <p className="text-warm-700 leading-relaxed">
            {renderBoldClickable(
              direction === 'de-to-en'
                ? (currentCard.exampleSentenceDe || currentCard.exampleSentence)
                : currentCard.exampleSentence
            )}
          </p>
        </div>

        {/* Word */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest mb-2">
              {direction === 'en-to-de' ? 'Englisch' : 'Deutsch'}
            </p>
            <div className="flex items-start gap-2">
              <p className="font-display font-normal text-2xl sm:text-3xl text-warm-900 break-words hyphens-auto flex-1">{showWord}</p>
              {/* Audio only for English word */}
              {direction === 'en-to-de' && <SpeakButton text={showWord} className="shrink-0 mt-1" />}
            </div>
          </div>

          {/* Synonyms on front only for en-to-de */}
          {direction === 'en-to-de' && currentCard.synonyms?.length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest mb-1">Synonyme</p>
              <p className="text-warm-600 text-sm">{currentCard.synonyms.join(', ')}</p>
            </div>
          )}

          {/* Revealed section — de-to-en */}
          {revealed && direction === 'de-to-en' && (
            <div className="animate-fade-in space-y-4 pt-4 border-t border-warm-100">
              <div>
                <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest mb-2">Englisch</p>
                <div className="flex items-center gap-2">
                  <p className="font-display font-normal text-2xl text-warm-900">{revealWord}</p>
                  <SpeakButton text={revealWord} />
                </div>
              </div>
              {currentCard.synonyms?.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest mb-1">Englische Synonyme</p>
                  <p className="text-warm-600 text-sm">{currentCard.synonyms.join(', ')}</p>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest">Beispielsatz (Englisch)</p>
                  <SpeakButton text={stripMarkdown(currentCard.exampleSentence)} />
                </div>
                <p className="text-sm text-warm-700 p-3 bg-warm-50 rounded-xl leading-relaxed">
                  {renderBoldClickable(currentCard.exampleSentence)}
                </p>
              </div>
              {currentCard.additionalExamples?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest">Weiterer Beispielsatz</p>
                    <SpeakButton text={currentCard.additionalExamples[0]} />
                  </div>
                  <p className="text-sm text-warm-600 p-3 bg-warm-50 rounded-xl leading-relaxed">
                    <WordPopup text={currentCard.additionalExamples[0]} />
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Revealed section — en-to-de */}
          {revealed && direction === 'en-to-de' && (
            <div className="animate-fade-in space-y-4 pt-4 border-t border-warm-100">
              <div>
                <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest mb-2">Deutsch</p>
                <p className="font-display font-normal text-2xl text-warm-900">{revealWord}</p>
              </div>
              {currentCard.additionalExamples?.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest mb-2">Weitere Beispiele</p>
                  <div className="space-y-2">
                    {currentCard.additionalExamples.map((ex, i) => (
                      <div key={i} className="relative">
                        <p className="text-warm-600 text-sm p-3 pr-10 bg-warm-50 rounded-xl">
                          <WordPopup text={ex} />
                        </p>
                        {/* Additional examples are always English */}
                        <SpeakButton
                          text={ex}
                          className="absolute top-1.5 right-1.5"
                        />
                      </div>
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
        <button onClick={() => setRevealed(true)} className="btn btn-outline w-full py-4">
          Antwort anzeigen
        </button>
      ) : (
        <div className="flex gap-3">
          <button onClick={() => handleAnswer(false)} className="btn btn-outline flex-1 py-4">
            Nicht gewusst
          </button>
          <button onClick={() => handleAnswer(true)} className="btn btn-primary flex-1 py-4">
            Gewusst
          </button>
        </div>
      )}
    </div>
  );
}
