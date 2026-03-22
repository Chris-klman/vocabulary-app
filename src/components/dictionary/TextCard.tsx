import { Card, CardContent, CopyButton } from '@/components/ui';
import type { TextTranslationResponse } from '@/types';

interface TextCardProps {
  data: TextTranslationResponse;
  isStreaming?: boolean;
}

export function TextCard({ data, isStreaming = false }: TextCardProps) {
  return (
    <Card className="animate-fade-in">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-medium text-warm-400 uppercase tracking-widest">
            Übersetzung
          </p>
          {data.translation && !isStreaming && (
            <div className="-my-1.5"><CopyButton text={data.translation} /></div>
          )}
        </div>
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
