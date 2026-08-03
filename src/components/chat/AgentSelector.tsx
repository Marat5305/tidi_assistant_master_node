// src/components/chat/AgentSelector.tsx
import { useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { ChevronDown, Check } from 'lucide-react';

interface AgentSelectorProps {
  selectedFilterAgentId?: string | null;
  onFilterChange?: (agentId: string | null) => void;
}

export function AgentSelector({ selectedFilterAgentId, onFilterChange }: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const agentsList = useChatStore((state) => state.agents_list);

  // Определяем, какой агент выбран для отображения в селекте
  const displayAgentId = selectedFilterAgentId !== undefined ? selectedFilterAgentId : null;

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return 'Все агенты';
    const agent = agentsList.find(a => a.agent_id === agentId);
    return agent?.agent_name || agentId;
  };

  const handleSelect = (agentId: string | null) => {
    if (onFilterChange) {
      onFilterChange(agentId);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-sm bg-[var(--color-surface)] border border-[var(--color-accent)] rounded-lg flex items-center justify-between hover:bg-[var(--color-accent)]/5 transition-colors"
      >
        <span className="truncate">{getAgentName(displayAgentId)}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--color-surface)] border border-[var(--color-accent)] rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="p-1">
            {/* Опция "Все агенты" */}
            {/* <button
              onClick={() => handleSelect(null)}
              className={`w-full px-3 py-2 text-sm text-left rounded-md flex items-center justify-between hover:bg-[var(--color-accent)]/10 transition-colors ${
                displayAgentId === null ? 'bg-[var(--color-accent)]/10' : ''
              }`}
            >
              <span>Все агенты</span>
              {displayAgentId === null && <Check size={16} className="text-[var(--color-accent)]" />}
            </button> */}

            {/* Список агентов */}
            {agentsList.map((agent) => (
              <button
                key={agent.agent_id}
                onClick={() => handleSelect(agent.agent_id)}
                className={`w-full px-3 py-2 text-sm text-left rounded-md flex items-center justify-between hover:bg-[var(--color-accent)]/10 transition-colors ${
                  displayAgentId === agent.agent_id ? 'bg-[var(--color-accent)]/10' : ''
                }`}
              >
                <span>{agent.agent_name}</span>
                {displayAgentId === agent.agent_id && <Check size={16} className="text-[var(--color-accent)]" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}