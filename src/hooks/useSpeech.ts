import { useCallback, useEffect, useState } from 'react';

const isSupported =
  typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * Thin wrapper around the browser's Web Speech API.
 * Handles cancellation of previous playback and tracks speaking state.
 */
export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      if (isSupported) window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string, lang = 'en-US') => {
    if (!isSupported || !text.trim()) return;

    // Cancel any ongoing utterance first
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;  // Slightly slower for language learning
    utterance.pitch = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    // Small delay after cancel() for cross-browser reliability
    setTimeout(() => window.speechSynthesis.speak(utterance), 50);
  }, []);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, isSupported };
}

/**
 * Strip **bold** markdown markers before passing text to TTS.
 */
export function stripMarkdown(text: string): string {
  return text.replace(/\*\*/g, '');
}
