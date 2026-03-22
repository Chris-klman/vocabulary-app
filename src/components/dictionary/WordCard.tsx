import { Card, CardHeader, CardContent, Button, WordPopup } from '@/components/ui';
import type { PartialWordData } from '@/lib/openai';

interface WordCardProps {
  wordData: PartialWordData;
  onAddToVocabulary: () => void;
  isAdding?: boolean;
  alreadyAdded?: boolean;
  isStreaming?: boolean;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest mb-2">
      {children}
    </p>
  );
}

export function WordCard({ wordData, onAddToVocabulary, isAdding = false, alreadyAdded = false, isStreaming = false }: WordCardProps) {
  const extraChips = [
    ...(wordData.translation?.slice(1) ?? []),
    ...(wordData.synonyms ?? []),
  ];

  return (
    <Card className="animate-fade-in overflow-hidden">
      <CardHeader>
        {/* Word + button on same row; min-w-0 + break-words ensures button never gets displaced */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-normal text-warm-900 leading-snug break-words">
              {wordData.word}
            </h2>
            {wordData.partOfSpeech && wordData.partOfSpeech.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {wordData.partOfSpeech.map((pos, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-warm-100 text-warm-600 rounded-md text-xs">
                    {pos}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Button
            variant={alreadyAdded ? 'ghost' : 'outline'}
            size="sm"
            onClick={onAddToVocabulary}
            disabled={isAdding || alreadyAdded || isStreaming || !wordData.translation}
            className="shrink-0"
          >
            {alreadyAdded ? '✓ Gespeichert' : isAdding ? '…' : '+ Hinzufügen'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Translation — primary focus */}
        {wordData.translation && wordData.translation.length > 0 && (
          <div>
            <SectionLabel>Übersetzung</SectionLabel>
            {/* Main translation */}
            <p className="text-xl font-medium text-warm-900 leading-snug">
              {wordData.translation[0]}
            </p>
            {wordData.ipa && (
              <p className="text-warm-400 text-sm tracking-wide mt-0.5">/{wordData.ipa}/</p>
            )}
            {/* All further translations + synonyms in one unified chip row */}
            {extraChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {extraChips.map((chip, idx) => (
                  <span key={idx} className="px-2.5 py-1 bg-warm-100 text-warm-600 rounded-lg text-sm">
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Definition */}
        {wordData.definition && (
          <div>
            <SectionLabel>Definition</SectionLabel>
            <p className="text-warm-700 leading-relaxed">{wordData.definition}</p>
          </div>
        )}

        {/* Examples */}
        {wordData.examples && wordData.examples.length > 0 && (
          <div>
            <SectionLabel>Beispielsätze</SectionLabel>
            <div className="space-y-3">
              {wordData.examples.map((example, idx) => (
                <div key={idx} className="border-l-2 border-warm-200 pl-4 py-1">
                  <p className="text-warm-800 leading-relaxed">
                    <WordPopup text={example.english} />
                  </p>
                  <p className="text-warm-500 text-sm mt-1 leading-relaxed">
                    {example.german}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex items-center gap-1 pt-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-warm-300"
                style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
