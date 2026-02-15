import { useState, useRef, useEffect } from 'react';
import { vocabularyStorage } from '@/lib/storage';
import { lookupWord } from '@/lib/openai';

interface WordPopupProps {
  text: string;
}

export function WordPopup({ text }: WordPopupProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setSelectedWord(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleWordClick = (word: string, e: React.MouseEvent) => {
    const cleaned = word.replace(/[^a-zA-ZäöüßÄÖÜ-]/g, '');
    if (cleaned.length < 2) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopupPos({ x: rect.left, y: rect.bottom + 8 });
    setSelectedWord(cleaned);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!selectedWord) return;
    setSaving(true);

    try {
      const exists = await vocabularyStorage.wordExists(selectedWord, 'en');
      if (!exists) {
        try {
          const data = await lookupWord(selectedWord, 'en');
          await vocabularyStorage.addWord({
            word: data.word,
            language: 'en',
            translation: data.translation,
            definition: data.definition,
            partOfSpeech: data.partOfSpeech,
            ipa: data.ipa,
            examples: data.examples,
            synonyms: data.synonyms,
            relatedWords: data.relatedWords,
            usageHints: data.usageHints,
            source: 'user-added',
          });
        } catch {
          // If lookup fails, save with minimal data
          await vocabularyStorage.addWord({
            word: selectedWord,
            language: 'en',
            translation: [],
            definition: '',
            partOfSpeech: [],
            ipa: '',
            examples: [],
            synonyms: [],
            relatedWords: [],
            usageHints: [],
            source: 'user-added',
          });
        }
      }
      setSaved(true);
      setTimeout(() => setSelectedWord(null), 1000);
    } catch (err) {
      console.error('Error saving word:', err);
    } finally {
      setSaving(false);
    }
  };

  // Split text into words, preserving spaces and punctuation
  const parts = text.split(/(\s+)/);

  return (
    <span className="relative">
      {parts.map((part, i) => {
        if (/^\s+$/.test(part)) return <span key={i}>{part}</span>;

        // Check if this part contains bold markers
        const boldMatch = part.match(/^\*\*(.*?)\*\*(.*)$/);
        if (boldMatch) {
          return (
            <span key={i}>
              <strong
                className="font-bold text-black cursor-pointer hover:underline"
                onClick={(e) => handleWordClick(boldMatch[1], e)}
              >
                {boldMatch[1]}
              </strong>
              {boldMatch[2]}
            </span>
          );
        }

        return (
          <span
            key={i}
            className="cursor-pointer hover:underline hover:text-black"
            onClick={(e) => handleWordClick(part, e)}
          >
            {part}
          </span>
        );
      })}

      {selectedWord && popupPos && (
        <div
          ref={popupRef}
          className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 animate-fade-in"
          style={{ left: Math.min(popupPos.x, window.innerWidth - 200), top: popupPos.y }}
        >
          <p className="font-semibold text-sm mb-2">{selectedWord}</p>
          {saved ? (
            <p className="text-success text-xs font-medium">Gespeichert!</p>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? 'Speichern...' : '+ Zur Bibliothek'}
            </button>
          )}
        </div>
      )}
    </span>
  );
}
