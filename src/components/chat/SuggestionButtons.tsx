// src/components/chat/SuggestionButtons.tsx
import { type  SuggestionAction } from '../../types/chat';

interface SuggestionButtonsProps {
  suggestions: SuggestionAction[];
  onSuggestionClick: (prompt: string) => void;
}

export function SuggestionButtons({ suggestions, onSuggestionClick }: SuggestionButtonsProps) {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2 mx-6">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={() => onSuggestionClick(suggestion.prompt)}
          className="
            px-3 py-1.5 
            text-sm 
            bg-[var(--color-accent)]/50 dark:bg-gray-800 
            rounded-tl-lg rounded-tr-lg rounded-br-lg
            text-gray-700 dark:text-gray-300
            hover:bg-[var(--color-hover)]
            hover:text-white 
            hover:shadow-sm
            transition-all 
            duration-200 
            ease-out
            cursor-pointer
          "
        >
          {suggestion.label}
        </button>
      ))}
    </div>
  );
}