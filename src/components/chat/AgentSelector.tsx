// src/components/chat/AgentSelector.tsx
import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';
import { AGENTS } from '../../config/agents';

export function AgentSelector() {
  const agents_list = useChatStore((state) => state.agents_list);
  const getAllAgentsSessions = useChatStore((state) => state.getAllAgentsSessions);
  const agentId = useChatStore((state) => state.agentId);
  const setAgentId = useChatStore((state) => state.setAgentId);
  const setMasterMode = useChatStore((state) => state.setMasterMode);
  const setStreaming = useChatStore((state) => state.setStreaming);
  const clearMessages = useChatStore((state) => state.clearMessages);

  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      getAllAgentsSessions();
    }
  }, []);

  useEffect(() => {
    if (agentId) {
      setSelectedAgentId(agentId);
    } else {
      setSelectedAgentId('all');
    }
  }, [agentId]);

  const agentsWithSessions = AGENTS.map(agent => {
    const agentData = agents_list.find(item => item.agent_id === agent.id);
    return {
      ...agent,
      sessionsCount: agentData?.sessions?.length || 0
    };
  });

  const handleAgentChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newAgentId = event.target.value;
    setSelectedAgentId(newAgentId);

    setStreaming(false);
    clearMessages();
    setMasterMode(true);

    if (newAgentId !== 'all') {
      // Выбран конкретный агент - загружаем его сессии
      setAgentId(newAgentId);
    } else {
      // Выбраны все агенты - показываем все сессии из agents_list
      const allSessions = agents_list.flatMap(agent => agent.sessions);

      useChatStore.setState({
        agentId: null,
        currentSessionId: null,
        sessions: allSessions,
      });
    }
  };

  const displayAgents = agentsWithSessions.filter(
    agent => agent.id !== 'ocr' && agent.id !== 'tech_rag'
  );
  // const displayAgents = agentsWithSessions;

  const totalSessions = agentsWithSessions.reduce((sum, a) => sum + a.sessionsCount, 0);

  return (
    <div className="mb-4">
      <select
        value={selectedAgentId}
        onChange={handleAgentChange}
        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 
                   text-gray-500 hover:border-[var(--color-accent)] 
                   hover:text-[var(--color-accent)] transition-all
                   bg-[var(--color-surface)] cursor-pointer"
      >
        <option value="all">
          Все агенты ({totalSessions})
        </option>
        {displayAgents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name} ({agent.sessionsCount})
          </option>
        ))}
      </select>
    </div>
  );
}