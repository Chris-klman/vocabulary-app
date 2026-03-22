import { useState, useRef, useEffect, useCallback } from 'react';

export type SpeechErrorCode =
  | 'not-allowed'          // microphone permission denied by user
  | 'service-not-allowed'  // speech service unavailable (iOS PWA / HTTP)
  | 'no-speech'            // timeout — nothing spoken (not shown to user)
  | 'aborted'              // stopped deliberately (not shown to user)
  | 'network'              // no connection to speech service
  | 'audio-capture'        // no microphone found
  | 'unknown';

function mapErrorCode(raw: string): SpeechErrorCode {
  switch (raw) {
    case 'not-allowed':         return 'not-allowed';
    case 'service-not-allowed': return 'service-not-allowed';
    case 'no-speech':           return 'no-speech';
    case 'aborted':             return 'aborted';
    case 'network':             return 'network';
    case 'audio-capture':       return 'audio-capture';
    default:                    return 'unknown';
  }
}

interface Options {
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  error: SpeechErrorCode | null;
  clearError: () => void;
  toggle: () => void;
}

export function useSpeechRecognition({ onInterim, onFinal }: Options): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<SpeechErrorCode | null>(null);
  const recognitionRef = useRef<any>(null);

  // Stable refs so recognition handlers always see the latest callbacks
  const onFinalRef = useRef(onFinal);
  const onInterimRef = useRef(onInterim);
  useEffect(() => { onFinalRef.current = onFinal; });
  useEffect(() => { onInterimRef.current = onInterim; });

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const clearError = useCallback(() => setError(null), []);

  const toggle = useCallback(() => {
    // Clear any previous error on new attempt
    setError(null);

    // Stop if already running
    if (recognitionRef.current) {
      console.log('[Speech] stopping recognition');
      recognitionRef.current.stop();
      return;
    }

    if (!isSupported) {
      console.warn('[Speech] SpeechRecognition not supported in this environment');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Recognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    const r = new Recognition();

    r.continuous = false;      // iOS Safari does not support continuous
    r.interimResults = true;   // Ignored by iOS, works on Chrome
    r.lang = navigator.language || 'de-DE';

    r.onresult = (e: any) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += text;
        else interim += text;
      }
      if (interim) {
        console.log('[Speech] interim:', interim);
        onInterimRef.current?.(interim);
      }
      if (final) {
        console.log('[Speech] final:', final);
        onFinalRef.current(final);
      }
    };

    r.onend = () => {
      console.log('[Speech] recognition ended');
      recognitionRef.current = null;
      setIsListening(false);
    };

    r.onerror = (e: any) => {
      const code = mapErrorCode(e.error ?? 'unknown');
      console.warn('[Speech] error:', code, '(raw:', e.error, ')');

      recognitionRef.current = null;
      setIsListening(false);

      // no-speech and aborted are normal termination — don't surface to user
      if (code !== 'no-speech' && code !== 'aborted') {
        setError(code);
      }
    };

    // start() must be called synchronously within the user gesture handler.
    // Wrap in try-catch: on iOS it may throw if called outside gesture scope.
    try {
      r.start();
      recognitionRef.current = r;
      setIsListening(true);
      console.log('[Speech] recognition started, lang:', r.lang);
    } catch (err) {
      console.error('[Speech] start() threw synchronously:', err);
      setError('unknown');
    }
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => () => { recognitionRef.current?.stop(); }, []);

  return { isListening, isSupported, error, clearError, toggle };
}
