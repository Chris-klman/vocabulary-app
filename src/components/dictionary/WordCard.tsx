import { Card, CardHeader, CardContent, Button, WordPopup } from '@/components/ui';
import type { WordLookupResponse } from '@/types';

interface WordCardProps {
  wordData: WordLookupResponse;
  onAddToVocabulary: () => void;
  isAdding?: boolean;
  alreadyAdded?: boolean;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest mb-2">
      {children}
    </p>
  );
}

export function WordCard({ wordData, onAddToVocabulary, isAdding = false, alreadyAdded = false }: WordCardProps) {
  return (
    <Card className="animate-fade-in overflow-hidden">
      {/* Word Header */}
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="font-display text-3xl font-normal text-warm-900 leading-tight mb-1">
              {wordData.word}
            </h2>
            {wordData.ipa && (
              <p className="text-warm-400 text-sm tracking-wide">/{wordData.ipa}/</p>
            )}
          </div>
          <Button
            variant={alreadyAdded ? 'ghost' : 'outline'}
            size="sm"
            onClick={onAddToVocabulary}
            disabled={isAdding || alreadyAdded}
          >
            {alreadyAdded ? '✓ Gespeichert' : isAdding ? '…' : '+ Hinzufügen'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Translations */}
        {wordData.translation && wordData.translation.length > 0 && (
          <div>
            <SectionLabel>Übersetzung</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {wordData.translation.map((trans, idx) => (
                <span key={idx} className="px-3 py-1 bg-warm-900 text-warm-50 rounded-lg text-sm">
                  {trans}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Part of Speech */}
        {wordData.partOfSpeech && wordData.partOfSpeech.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {wordData.partOfSpeech.map((pos, idx) => (
              <span key={idx} className="px-2 py-1 bg-warm-100 text-warm-600 rounded-md text-xs">
                {pos}
              </span>
            ))}
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

        {/* Synonyms */}
        {wordData.synonyms && wordData.synonyms.length > 0 && (
          <div>
            <SectionLabel>Synonyme</SectionLabel>
            <p className="text-warm-600 leading-relaxed">{wordData.synonyms.join(', ')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
