import { Card, CardHeader, CardContent, Button, CopyButton } from '@/components/ui';
import type { SentenceTranslationResponse } from '@/types';

const STYLE_CONFIG = {
  standard: { label: 'Standard',        className: 'bg-warm-900 text-warm-50' },
  formal:   { label: 'Formell',         className: 'bg-warm-700 text-warm-50' },
  informal: { label: 'Umgangssprachlich', className: 'bg-warm-100 text-warm-700' },
} as const;

interface SentenceCardProps {
  data: SentenceTranslationResponse;
  onAddToVocabulary: () => void;
  isAdding?: boolean;
  alreadyAdded?: boolean;
  isStreaming?: boolean;
}

export function SentenceCard({
  data,
  onAddToVocabulary,
  isAdding = false,
  alreadyAdded = false,
  isStreaming = false,
}: SentenceCardProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest mb-2">
              Original
            </p>
            <p className="font-display font-normal text-lg text-warm-900 leading-relaxed">
              {data.original}
            </p>
          </div>
          <Button
            variant={alreadyAdded ? 'ghost' : 'outline'}
            size="sm"
            onClick={onAddToVocabulary}
            disabled={isAdding || alreadyAdded || isStreaming}
          >
            {alreadyAdded ? '✓ Gespeichert' : isAdding ? '…' : '+ Hinzufügen'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest">
          Übersetzungsvarianten
        </p>
        {data.variants.map((variant) => {
          const config = STYLE_CONFIG[variant.style] ?? {
            label: variant.style,
            className: 'bg-warm-100 text-warm-700',
          };
          return (
            <div key={variant.style} className="bg-warm-50 rounded-xl p-4 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${config.className}`}>
                  {config.label}
                </span>
                <CopyButton text={variant.text} />
              </div>
              <p className="text-warm-800 leading-relaxed">{variant.text}</p>
            </div>
          );
        })}
        {isStreaming && (
          <div className="flex items-center gap-1 py-2 pl-1">
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
