import { useState, useEffect, useRef, useCallback } from 'react';
import { assessmentStorage, vocabularyStorage } from '@/lib/storage';
import { generateAssessmentWords } from '@/lib/openai';
import { Spinner, SpeakButton } from '@/components/ui';
import type { AssessmentWord } from '@/types';

// Number of words to fetch per batch
const BATCH_SIZE = 30;
// Trigger background prefetch when this many words remain
const PREFETCH_THRESHOLD = 8;

type Phase = 'loading' | 'assessing' | 'done';

export function AssessmentView() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [queue, setQueue] = useState<AssessmentWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Ref to prevent concurrent fetches
  const fetchingRef = useRef(false);

  const currentWord: AssessmentWord | null = queue[currentIndex] ?? null;
  const remaining = queue.length - currentIndex;

  // ── Fetch a new batch and append to queue ──────────────────────────────────
  const fetchBatch = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setIsFetching(true);
    setFetchError(null);

    try {
      const [allAssessed, libraryWords] = await Promise.all([
        assessmentStorage.getAllWordStrings(),
        vocabularyStorage.getAllWords(),
      ]);
      const exclude = [
        ...allAssessed,
        ...libraryWords.map((w) => w.word.toLowerCase()),
      ];

      const candidates = await generateAssessmentWords(BATCH_SIZE, [...new Set(exclude)]);
      await assessmentStorage.addBatch(candidates);

      // Reload pending from DB and append only words not already in queue
      const pending = await assessmentStorage.getPendingWords();
      setQueue((prev) => {
        const existingIds = new Set(prev.map((w) => w.id));
        const newOnes = pending.filter((w) => !existingIds.has(w.id));
        return [...prev, ...newOnes];
      });
    } catch {
      setFetchError('Neue Wörter konnten nicht geladen werden. Bitte erneut versuchen.');
    } finally {
      fetchingRef.current = false;
      setIsFetching(false);
    }
  }, []);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const pending = await assessmentStorage.getPendingWords();
      if (pending.length > 0) {
        setQueue(pending);
        setPhase('assessing');
      } else {
        // First use — fetch initial batch
        try {
          await fetchBatch();
          setPhase('assessing');
        } catch {
          setPhase('assessing'); // Stay on assessing; error shown via fetchError
        }
      }
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Background prefetch when running low ──────────────────────────────────
  useEffect(() => {
    if (phase === 'assessing' && remaining <= PREFETCH_THRESHOLD && !fetchingRef.current) {
      fetchBatch();
    }
  }, [remaining, phase, fetchBatch]);

  // ── Advance to next word ───────────────────────────────────────────────────
  const advance = () => {
    setRevealed(false);
    setSessionCount((s) => s + 1);
    setCurrentIndex((i) => i + 1);
  };

  const handleKnown = async () => {
    if (!currentWord) return;
    await assessmentStorage.markKnown(currentWord.id);
    advance();
  };

  const handleUnknown = async () => {
    if (!currentWord) return;
    await assessmentStorage.markAdded(currentWord.id);

    // Save to vocabulary library with basic data; full card generated lazily on learn
    try {
      const exists = await vocabularyStorage.wordExists(currentWord.word, 'en');
      if (!exists) {
        await vocabularyStorage.addWord({
          word: currentWord.word,
          language: 'en',
          translation: [currentWord.translation],
          definition: '',
          partOfSpeech: currentWord.partOfSpeech ? [currentWord.partOfSpeech] : [],
          ipa: '',
          examples: [],
          synonyms: [],
          relatedWords: [],
          usageHints: [],
          source: 'assessment',
        });
      }
    } catch (err) {
      console.error('Error saving word to library:', err);
    }

    advance();
  };

  // ── Phase: loading ─────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
        <p className="mt-4 text-warm-500">Wörter werden geladen...</p>
      </div>
    );
  }

  // ── Phase: done (queue exhausted, no fetch in progress) ───────────────────
  if (!currentWord && !isFetching && phase === 'assessing') {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="font-display font-normal text-3xl text-warm-900">Alle eingestuft</h1>
          <p className="text-warm-500">
            {sessionCount} {sessionCount === 1 ? 'Wort' : 'Wörter'} in dieser Session bewertet
          </p>
          <p className="text-sm text-warm-400">
            Neue Wörter erscheinen automatisch, wenn du den Tab wieder öffnest.
          </p>
        </div>
        <button
          onClick={() => fetchBatch()}
          className="btn btn-outline w-full"
        >
          Weitere Wörter laden
        </button>
      </div>
    );
  }

  // ── Phase: assessing ──────────────────────────────────────────────────────
  return (
    <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-normal text-3xl text-warm-900">Einstufen</h1>
          <p className="text-sm text-warm-500 mt-0.5">
            Entscheide schnell, welche Wörter du kennst
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-warm-900">{sessionCount}</p>
          <p className="text-xs text-warm-400">eingestuft</p>
        </div>
      </div>

      {/* Progress bar within current batch */}
      {queue.length > 0 && (
        <div className="w-full bg-warm-200 rounded-full h-1">
          <div
            className="bg-warm-900 h-1 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (currentIndex / queue.length) * 100)}%` }}
          />
        </div>
      )}

      {/* Word card */}
      {currentWord ? (
        <div className="card p-8 text-center space-y-6 min-h-[260px] flex flex-col items-center justify-center">
          <div className="space-y-2 w-full">
            <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest">Englisch</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <p className="font-display font-normal text-4xl sm:text-5xl tracking-tight text-warm-900 break-words hyphens-auto max-w-full">{currentWord.word}</p>
              <SpeakButton text={currentWord.word} className="shrink-0" />
            </div>
            {currentWord.partOfSpeech && (
              <p className="text-sm text-warm-400 italic">{currentWord.partOfSpeech}</p>
            )}
          </div>

          {revealed ? (
            <div className="animate-fade-in space-y-1">
              <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest">Übersetzung</p>
              <p className="font-display font-normal text-2xl text-warm-700">{currentWord.translation}</p>
            </div>
          ) : (
            <button
              onClick={() => setRevealed(true)}
              className="text-sm text-warm-400 hover:text-warm-700 underline underline-offset-4 transition-colors"
            >
              Antwort anzeigen
            </button>
          )}
        </div>
      ) : isFetching ? (
        <div className="card p-8 flex flex-col items-center justify-center min-h-[260px] space-y-3">
          <Spinner size="lg" />
          <p className="text-warm-500 text-sm">Neue Wörter werden geladen...</p>
        </div>
      ) : null}

      {/* Error notice */}
      {fetchError && (
        <div className="p-4 bg-[#f0d4d4] border border-[#d9a8a8] rounded-xl text-center">
          <p className="text-sm text-[#7c2828]">{fetchError}</p>
          <button
            onClick={() => { setFetchError(null); fetchBatch(); }}
            className="text-sm text-[#7c2828] underline mt-1"
          >
            Erneut versuchen
          </button>
        </div>
      )}

      {/* Action buttons */}
      {currentWord && (
        <div className="flex gap-3">
          <button
            onClick={handleUnknown}
            className="btn btn-outline flex-1 text-base py-4"
          >
            Einstufen
          </button>
          <button
            onClick={handleKnown}
            className="btn btn-primary flex-1 text-base py-4"
          >
            Kenne ich
          </button>
        </div>
      )}

      {/* Background fetch indicator */}
      {isFetching && currentWord && (
        <p className="text-center text-xs text-warm-400">Neue Wörter werden im Hintergrund geladen…</p>
      )}
    </div>
  );
}
