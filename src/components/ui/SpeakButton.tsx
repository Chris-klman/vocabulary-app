import { useSpeech } from '@/hooks';

interface SpeakButtonProps {
  /** Plain text to speak (no markdown). */
  text: string;
  lang?: string;
  className?: string;
}

/**
 * Small, accessible button that triggers browser TTS for English text.
 * Renders nothing when the Web Speech API is unavailable.
 */
export function SpeakButton({ text, lang = 'en-US', className = '' }: SpeakButtonProps) {
  const { speak, isSpeaking, isSupported } = useSpeech();

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        speak(text, lang);
      }}
      aria-label={`Aussprechen: ${text}`}
      title="Aussprechen"
      className={[
        'inline-flex items-center justify-center',
        'w-7 h-7 rounded-full',
        'transition-colors',
        isSpeaking
          ? 'text-black bg-gray-100'
          : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100',
        className,
      ].join(' ')}
    >
      {/* Speaker-with-waves icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
        aria-hidden="true"
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    </button>
  );
}
