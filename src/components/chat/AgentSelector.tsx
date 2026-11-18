import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { AGENTS } from '../../config/agents';
import { ChevronDown, Check, Database } from 'lucide-react';

interface AgentSelectorProps {
  selectedFilterModel: string | null;
  onFilterChange: (model: string | null) => void;
}

export function AgentSelector({ selectedFilterModel, onFilterChange }: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const modelsList = useChatStore((state) => state.models_list);
  const availableRags = useChatStore((state) => state.availableRags);
  const loadAvailableRags = useChatStore((state) => state.loadAvailableRags);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Загружаем RAG-наборы через стор при открытии
  useEffect(() => {
    if (isOpen) loadAvailableRags();
  }, [isOpen, loadAvailableRags]);

  useEffect(() => {
    if (!isOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [isOpen]);

  const options = modelsList.length > 0 ? modelsList : AGENTS.map((a) => ({ model: a.id, model_name: a.name, conversations: [] }));
  const displayModel = selectedFilterModel;

  const getAgentName = (model: string | null) => {
    if (!model) return 'Все агенты';
    if (model.startsWith('rag/')) {
      const ragId = model.slice(4);
      const rag = availableRags.find(r => r.id === ragId);
      return rag ? `RAG: ${rag.name}` : `RAG: ${ragId}`;
    }
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
      >
        <span className="truncate">{getAgentName(displayModel)}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-accent)] rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="p-1">
            <button
              onClick={() => handleSelect(null)}
              className={`w-full px-3 py-2 text-sm text-left rounded-md flex items-center justify-between hover:bg-[var(--color-accent)]/10 ${displayModel === null ? 'bg-[var(--color-accent)]/10' : ''}`}
            >
              <span>Все агенты</span>
              {displayModel === null && <Check size={16} className="text-[var(--color-accent)]" />}
            </button>

            {options.map((agent) => {
              if (agent.model === 'agentic_rag') {
                return (
                  <div key={agent.model} className="mt-1 border-t border-gray-100 dark:border-gray-700 pt-1">
                    <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                       <Database size={12} /> RAG Наборы
                    </div>
                    {availableRags.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-400">Загрузка...</div>
                    ) : (
                      availableRags.map((rag) => {
                        const ragModel = `rag/${rag.id}`;
                        const isActive = displayModel === ragModel;
                        return (
                          <button
                            key={ragModel}
                            onClick={() => handleSelect(ragModel)}
                            className={`w-full px-3 py-2 text-sm text-left rounded-md flex items-center justify-between hover:bg-[var(--color-accent)]/10 ${isActive ? 'bg-[var(--color-accent)]/10' : ''}`}
                          >
                            <span className="truncate">{rag.name}</span>
                            {isActive && <Check size={16} className="text-[var(--color-accent)]" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                );
              }

              const isActive = displayModel === agent.model;
              return (
                <button
                  key={agent.model}
                  onClick={() => handleSelect(agent.model)}
                  className={`w-full px-3 py-2 text-sm text-left rounded-md flex items-center justify-between hover:bg-[var(--color-accent)]/10 ${isActive ? 'bg-[var(--color-accent)]/10' : ''}`}
                >
                  <span className="truncate">{agent.model_name}</span>
                  {isActive && <Check size={16} className="text-[var(--color-accent)]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}