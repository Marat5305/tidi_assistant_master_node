// src/components/chat/ThreadSidebar.tsx
import { useEffect, useState, useMemo } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useUIStore } from '../../store/uiStore';
import { Menu, PanelLeftClose, Search, Plus, Trash2 } from 'lucide-react';
import { groupThreadsByDate, type ThreadGroup } from '../../utils/threadGrouping';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { AgentSelector } from './AgentSelector';
import logo from '../../assets/logo.svg';
import type { Session } from '../../types/chat';
import { formatDateShort } from '../../utils/dateFormat';

export function ThreadSidebar() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  const agentsList = useChatStore((state) => state.agents_list);
  const currentSessionId = useChatStore((state) => state.currentSessionId);
  const createThread = useChatStore((state) => state.createSession);
  const setActiveThread = useChatStore((state) => state.setActiveSession);
  const deleteThread = useChatStore((state) => state.deleteSession);
  const activeAgentId = useChatStore((state) => state.agentId);
  const getAllAgentsSessions = useChatStore((state) => state.getAllAgentsSessions);

  // Локальное состояние для фильтрации в сайдбаре (не влияет на activeAgentId)
  const [selectedFilterAgentId, setSelectedFilterAgentId] = useState<string | null>(null);

  const [threadGroups, setThreadGroups] = useState<ThreadGroup[]>([]);
  const [threadToDelete, setThreadToDelete] = useState<{ id: string; title: string } | null>(null);

  // Загружаем сессии всех агентов при монтировании
  useEffect(() => {
    getAllAgentsSessions();
  }, [getAllAgentsSessions]);

  // Получаем все сессии из agents_list с информацией об агенте
  const allSessionsWithAgentInfo = useMemo(() => {
    const result: Array<Session & { _agentId: string; _agentName: string }> = [];

    if (!Array.isArray(agentsList)) {
      console.warn('agentsList не является массивом:', agentsList);
      return result;
    }

    agentsList.forEach((agent) => {
      if (!agent || !Array.isArray(agent.sessions)) {
        console.warn('agent.sessions не является массивом:', agent);
        return;
      }

      agent.sessions.forEach((session) => {
        result.push({
          ...session,
          _agentId: agent.agent_id,
          _agentName: agent.agent_name,
        });
      });
    });

    return result;
  }, [agentsList]);

  // Фильтруем сессии на основе локального фильтра (selectedFilterAgentId)
  const filteredThreads = useMemo(() => {
    // Если фильтр не выбран ("Все агенты") - показываем все сессии
    if (!selectedFilterAgentId) {
      return allSessionsWithAgentInfo;
    }
    // Иначе показываем только сессии выбранного агента
    return allSessionsWithAgentInfo.filter((thread) => thread._agentId === selectedFilterAgentId);
  }, [allSessionsWithAgentInfo, selectedFilterAgentId]);

  useEffect(() => {
    setThreadGroups(groupThreadsByDate(filteredThreads));
  }, [filteredThreads]);

  const handleNewChat = () => {
    // Для создания чата используем активного агента из стора
    if (activeAgentId) {
      createThread();
    } else {
      console.warn('⚠️ Выберите агента перед созданием чата');
    }
  };

  const handleThreadClick = async (threadId: string) => {
    console.log('🖱️ Клик по сессии:', threadId);

    try {
      // Активируем сессию (она сама переключит агента)
      await setActiveThread(threadId);

      // Обновляем список сессий всех агентов
      await getAllAgentsSessions();

      console.log('✅ Сессия активирована:', threadId);
    } catch (error) {
      console.error('❌ Ошибка при активации сессии:', error);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, threadId: string, threadTitle: string) => {
    e.stopPropagation();
    setThreadToDelete({ id: threadId, title: threadTitle });
  };

  const handleConfirmDelete = () => {
    if (threadToDelete) {
      deleteThread(threadToDelete.id);
      setThreadToDelete(null);
    }
  };

  const handleCloseDialog = () => {
    setThreadToDelete(null);
  };

  // Обработчик изменения фильтра в селекте
  const handleFilterChange = (agentId: string | null) => {
    setSelectedFilterAgentId(agentId);
  };

  return (
    <>
      <div className="relative flex h-full">
        {!sidebarOpen && (
          <div className="absolute left-0 top-2 z-10 p-2">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-colors"
              aria-label="Открыть историю"
            >
              <Menu size={20} />
            </button>
          </div>
        )}

        <div
          className={`
            overflow-hidden transition-all duration-300 ease-out h-full
            ${sidebarOpen ? 'w-64 border-r border-[var(--color-accent)]' : 'w-0 border-r-0'}
          `}
        >
          <div className="w-64 h-full">
            {sidebarOpen && (
              <aside className="bg-[var(--color-surface)] p-4 flex flex-col h-full">
                <div className="flex justify-between items-end mb-4">
                  <div className="flex gap-1 items-end">
                    <img src={logo} alt="Логотип" className="h-8 w-auto" />
                    <h2 className="text-2xl font-bold italic tracking-wide text-gradient-logo">тиди</h2>
                  </div>
                  <div className="flex items-end gap-1">
                    <button
                      className="p-1.5 rounded-md text-gray-500 hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors"
                      aria-label="Поиск по истории"
                    >
                      <Search size={18} />
                    </button>
                    <button
                      onClick={toggleSidebar}
                      className="p-1.5 rounded-md text-gray-500 hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors"
                      aria-label="Свернуть сайдбар"
                    >
                      <PanelLeftClose size={18} />
                    </button>
                  </div>
                </div>

                {/* Передаем локальный фильтр в AgentSelector */}
                <AgentSelector
                  selectedFilterAgentId={selectedFilterAgentId}
                  onFilterChange={handleFilterChange}
                />

                <button
                  onClick={handleNewChat}
                  disabled={!activeAgentId}
                  className={`w-full mb-4 px-3 py-2 flex items-center gap-2 text-sm rounded-lg shadow-sm border border-gray-200 transition-all
                    ${activeAgentId
                      ? 'text-gray-500 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:shadow-md'
                      : 'text-gray-300 cursor-not-allowed opacity-50'}`}
                >
                  <Plus size={16} />
                  Новый чат
                </button>

                {filteredThreads.length > 0 ? (
                  <div className="flex-1 overflow-y-auto thin-scrollbar">
                    {threadGroups.map((group) => (
                      <div key={group.title} className="mb-4">
                        <p className="text-xs font-semibold text-gray-400 mb-2">{group.title}</p>

                        <div className="space-y-1">
                          {group.threads.map((thread) => {
                            const agentName = (thread as any)._agentName;

                            return (
                              <div
                                key={thread.id}
                                onClick={() => handleThreadClick(thread.id)}
                                className={`
                                  group relative px-3 py-2 rounded-lg cursor-pointer transition-all
                                  ${currentSessionId === thread.id
                                    ? 'bg-[var(--color-accent)]/50 dark:bg-blue-900/50'
                                    : 'hover:bg-[var(--color-accent)]/15 dark:hover:bg-gray-800'
                                  }
                                `}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">
                                      {thread.title ? thread.title : formatDateShort(thread.created_at)}
                                    </div>
                                    {!selectedFilterAgentId && agentName && (
                                      <div className="text-xs text-gray-400 truncate">
                                        {agentName}
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    onClick={(e) => handleDeleteClick(e, thread.id, thread.title)}
                                    className={`
                                      opacity-0 group-hover:opacity-100 transition-opacity
                                      p-1 rounded-md text-gray-400 hover:text-red-500 
                                      hover:bg-red-50 dark:hover:bg-red-900/20
                                      flex-shrink-0
                                    `}
                                    aria-label="Удалить чат"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-400 text-sm whitespace-pre-line">
                      {!selectedFilterAgentId && 'Выберите агента\nдля просмотра чатов'}
                      {selectedFilterAgentId === 'ocr' && 'Распознавание изображений\nНет чатов'}
                      {selectedFilterAgentId === 'tech_rag' && 'Техническая документация\nНет чатов'}
                      {selectedFilterAgentId && selectedFilterAgentId !== 'ocr' && selectedFilterAgentId !== 'tech_rag' &&
                        'Нет чатов'}
                    </div>
                  </div>
                )}
              </aside>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={threadToDelete !== null}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        title="Удалить чат?"
        description={`Вы уверены, что хотите удалить чат "${threadToDelete?.title}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        confirmVariant="danger"
      />
    </>
  );
}