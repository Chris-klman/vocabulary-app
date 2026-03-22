import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useSpeechRecognition, type SpeechErrorCode } from '@/hooks';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function IconMic({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

// User-facing message for each error code.
// no-speech and aborted are silent (normal termination).
const ERROR_MESSAGES: Partial<Record<SpeechErrorCode, string>> = {
  'not-allowed':         'Mikrofon-Zugriff verweigert. Bitte in den Einstellungen erlauben.',
  'service-not-allowed': 'Spracheingabe in dieser Umgebung nicht verfügbar.',
  'network':             'Keine Verbindung für Spracheingabe.',
  'audio-capture':       'Kein Mikrofon gefunden.',
  'unknown':             'Spracheingabe fehlgeschlagen.',
};

export function SearchBar({ onSearch, placeholder = 'Wort eingeben...', disabled = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [interimText, setInterimText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isListening, isSupported, error, clearError, toggle } = useSpeechRecognition({
    onInterim: (text) => setInterimText(text),
    onFinal: (text) => {
      setQuery((prev) => {
        const base = prev.trimEnd();
        return base ? base + ' ' + text : text;
      });
      setInterimText('');
    },
  });

  // Auto-dismiss transient errors after 5 s
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clearError, 5000);
    return () => clearTimeout(t);
  }, [error, clearError]);

  // Committed text + live interim transcript
  const displayValue = query + interimText;
  const errorMessage = error ? ERROR_MESSAGES[error] : null;

  // Auto-resize: empty → 140px (inviting), content → scrollHeight (compact)
  // useLayoutEffect avoids a paint flash by running before the browser draws.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';                              // collapse to measure
    const target = displayValue.length === 0 ? 140 : el.scrollHeight;
    el.style.height = `${target}px`;
  }, [displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    setInterimText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const trimmed = displayValue.trim();
      if (trimmed.length > 0) {
        onSearch(trimmed);
      }
    }
  };

  const handleClear = () => {
    setQuery('');
    setInterimText('');
  };

  return (
    <div className="w-full space-y-1.5">
      <div className="relative w-full">
        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? '' : placeholder}
          disabled={disabled}
          rows={1}
          style={{ height: '140px' }}
          className={`input resize-none overflow-hidden rounded-2xl leading-relaxed align-top pb-12${displayValue ? ' pr-10' : ''}`}
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
        />

        {/* Clear button — top-right */}
        {displayValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-3 flex items-center justify-center w-7 h-7 text-warm-400 hover:text-warm-700 transition-colors touch-manipulation rounded-full hover:bg-warm-100"
            aria-label="Eingabe löschen"
            tabIndex={-1}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Mic button — bottom-right (only when supported) */}
        {isSupported && (
          <button
            onClick={toggle}
            disabled={disabled}
            className={`absolute right-3 bottom-3 flex items-center justify-center w-8 h-8 rounded-full transition-all touch-manipulation ${
              isListening
                ? 'text-warm-900'
                : error
                ? 'text-warm-300'
                : 'text-warm-400 hover:text-warm-700 hover:bg-warm-100'
            }`}
            aria-label={isListening ? 'Aufnahme stoppen' : 'Spracheingabe starten'}
          >
            {isListening && (
              <span className="absolute inset-0 rounded-full bg-warm-200 animate-ping opacity-60" />
            )}
            <span className="relative">
              <IconMic size={isListening ? 20 : 18} />
            </span>
          </button>
        )}

        {/* Recording label — bottom-left */}
        {isListening && (
          <p className="absolute bottom-3 left-4 text-[11px] text-warm-400 tracking-wide select-none pointer-events-none">
            Aufnahme läuft…
          </p>
        )}
      </div>

      {/* Inline error message — shown below the field, auto-dismisses */}
      {errorMessage && (
        <p className="text-[11px] text-warm-500 px-1 leading-snug">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
