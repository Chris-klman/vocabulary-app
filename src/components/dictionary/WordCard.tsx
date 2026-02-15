import { Card, CardHeader, CardTitle, CardContent, Button, WordPopup } from '@/components/ui';
import type { WordLookupResponse } from '@/types';

interface WordCardProps {
  wordData: WordLookupResponse;
  onAddToVocabulary: () => void;
  isAdding?: boolean;
  alreadyAdded?: boolean;
}

export function WordCard({ wordData, onAddToVocabulary, isAdding = false, alreadyAdded = false }: WordCardProps) {
  return (
    <Card className="animate-fade-in">
      {/* Word Header */}
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-2xl mb-1">{wordData.word}</CardTitle>
            {wordData.ipa && (
              <p className="text-gray-500 text-sm">/{wordData.ipa}/</p>
            )}
          </div>
          <Button
            variant={alreadyAdded ? 'ghost' : 'success'}
            size="sm"
            onClick={onAddToVocabulary}
            disabled={isAdding || alreadyAdded}
          >
            {alreadyAdded ? '✓ Gespeichert' : isAdding ? 'Speichern...' : '+ Hinzufügen'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Translations */}
        {wordData.translation && wordData.translation.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Übersetzung</h3>
            <div className="flex flex-wrap gap-2">
              {wordData.translation.map((trans, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-black text-white rounded-lg text-sm"
                >
                  {trans}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Part of Speech */}
        {wordData.partOfSpeech && wordData.partOfSpeech.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Wortart</h3>
            <div className="flex flex-wrap gap-2">
              {wordData.partOfSpeech.map((pos, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                >
                  {pos}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Definition */}
        {wordData.definition && (
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Definition</h3>
            <p className="text-gray-800 leading-relaxed">{wordData.definition}</p>
          </div>
        )}

        {/* Examples */}
        {wordData.examples && wordData.examples.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-3">Beispielsätze</h3>
            <div className="space-y-3">
              {wordData.examples.map((example, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-800 mb-1">
                    <span className="font-medium">EN:</span> <WordPopup text={example.english} />
                  </p>
                  <p className="text-gray-600 text-sm">
                    <span className="font-medium">DE:</span> {example.german}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Synonyms */}
        {wordData.synonyms && wordData.synonyms.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Synonyme</h3>
            <p className="text-gray-700">{wordData.synonyms.join(', ')}</p>
          </div>
        )}

        {/* Related Words */}
        {wordData.relatedWords && wordData.relatedWords.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Verwandte Wörter</h3>
            <p className="text-gray-700">{wordData.relatedWords.join(', ')}</p>
          </div>
        )}

        {/* Usage Hints */}
        {wordData.usageHints && wordData.usageHints.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Verwendungshinweise</h3>
            <ul className="space-y-1">
              {wordData.usageHints.map((hint, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-gray-400">•</span>
                  <span>{hint}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
