import { Card, CardHeader, CardContent } from '@/components/ui';
import type { TextTranslationResponse } from '@/types';

interface TextCardProps {
  data: TextTranslationResponse;
  isStreaming?: boolean;
}

export function TextCard({ data, isStreaming = false }: TextCardProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest mb-2">Original</p>
        <p className="text-warm-500 leading-relaxed whitespace-pre-wrap">{data.original}</p>
      </CardHeader>

      <CardContent>
        <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest mb-2">
          Übersetzung
        </p>
        <p className="text-warm-900 leading-relaxed whitespace-pre-wrap">
          {data.translation || (isStreaming ? '\u00A0' : '')}
          {isStreaming && (
            <span className="inline-block w-[2px] h-[1.1em] bg-warm-400 ml-0.5 animate-pulse align-text-bottom" />
          )}
        </p>
      </CardContent>
    </Card>
  );
}
