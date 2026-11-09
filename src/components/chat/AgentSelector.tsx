// src/components/chat/AgentSelector.tsx
import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { AGENTS } from '../../config/agents';
import { ChevronDown, Check } from 'lucide-react';

interface AgentSelectorProps {
  selectedFilterModel: string | null;
  onFilterChange: (model: string | null) => void;
}

export function AgentSelector({
  selectedFilterModel,
  onFilterChange,
}: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modelsList = useChatStore((state) => state.models_list);
  const containerRef = useRef<HTMLDivElement>(null);

  // Закрытие по клику вне
  useEffect(() => {
    if (!isOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [isOpen]);

  // Источник опций:
  // 1) models_list (с бэка) — приоритет
  // 2) AGENTS из конфига — пока бэк не ответил
  const options = (
    modelsList.length > 0
      ? modelsList
      : AGENTS.map((a) => ({
          model: a.id,
          model_name: a.name,
          conversations: [],
        }))
  );

  const displayModel = selectedFilterModel;

  const getAgentName = (model: string | null) => {
    if (!model) return 'Все агенты';
    const agent = options.find((a) => a.model === model);
    return agent?.model_name || model;
  };

  const handleSelect = (model: string | null) => {
    onFilterChange(model);
    setIsOpen(false);
  };

  return (
    <div className="relative mb-4" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-accent)] rounded-lg flex items-center justify-between hover:bg-[var(--color-accent)]/5 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{getAgentName(displayModel)}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-accent)] rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
          role="listbox"
        >
          <div className="p-1">
            {/* «Все агенты» */}
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`w-full px-3 py-2 text-sm text-left rounded-md flex items-center justify-between hover:bg-[var(--color-accent)]/10 transition-colors ${
                displayModel === null ? 'bg-[var(--color-accent)]/10' : ''
              }`}
              role="option"
              aria-selected={displayModel === null}
            >
              <span>Все агенты</span>
              {displayModel === null && (
                <Check size={16} className="text-[var(--color-accent)]" />
              )}
            </button>

            {/* Список агентов */}
            {options.map((agent) => {
              const isActive = displayModel === agent.model;
              return (
                <button
                  key={agent.model}
                  type="button"
                  onClick={() => handleSelect(agent.model)}
                  className={`w-full px-3 py-2 text-sm text-left rounded-md flex items-center justify-between hover:bg-[var(--color-accent)]/10 transition-colors ${
                    isActive ? 'bg-[var(--color-accent)]/10' : ''
                  }`}
                  role="option"
                  aria-selected={isActive}
                >
                  <span className="truncate">{agent.model_name}</span>
                  {isActive && (
                    <Check
                      size={16}
                      className="text-[var(--color-accent)] flex-shrink-0"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}