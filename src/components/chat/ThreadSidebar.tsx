// src/components/chat/ThreadSidebar.tsx
import { useEffect, useState, useMemo } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useUIStore } from '../../store/uiStore';
import { Menu, PanelLeftClose, Search, Plus, Trash2 } from 'lucide-react';
import { groupThreadsByDate, type ThreadGroup } from '../../utils/threadGrouping';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { AgentSelector } from './AgentSelector';
import logo from '../../assets/logo.svg';

export function ThreadSidebar() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  const threads = useChatStore((state) => state.sessions);
  const currentSessionId = useChatStore((state) => state.currentSessionId);
  const createThread = useChatStore((state) => state.createSession);
  const setActiveThread = useChatStore((state) => state.setActiveSession);
  const deleteThread = useChatStore((state) => state.deleteSession);
  const activeAgentId = useChatStore((state) => state.agentId);

  const [threadGroups, setThreadGroups] = useState<ThreadGroup[]>([]);
  const [threadToDelete, setThreadToDelete] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    setThreadGroups(groupThreadsByDate(threads));
  }, [threads]);

  // В ThreadSidebar.tsx измените условие:
  const canShowSessions = useMemo(() => {
    // Если есть сессии и нет активного агента (режим "все") - показываем
    if (!activeAgentId && threads.length > 0) {
      return true;
    }
    // Если есть активный агент и это не ocr/tech_rag - показываем
    if (activeAgentId && activeAgentId !== 'ocr' && activeAgentId !== 'tech_rag') {
      return true;
    }
    return false;
  }, [activeAgentId, threads]);

  const handleNewChat = () => {
    if (activeAgentId && canShowSessions) {
      createThread();
    } else {
      console.warn('⚠️ Выберите агента перед созданием чата');
    }
  };

  const handleThreadClick = async (threadId: string) => {
    await setActiveThread(threadId);
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

                <AgentSelector />

                <button
                  onClick={handleNewChat}
                  disabled={!canShowSessions}
                  className={`w-full mb-4 px-3 py-2 flex items-center gap-2 text-sm rounded-lg shadow-sm border border-gray-200 transition-all
                    ${canShowSessions
                      ? 'text-gray-500 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:shadow-md'
                      : 'text-gray-300 cursor-not-allowed opacity-50'}`}
                >
                  <Plus size={16} />
                  Новый чат
                </button>

                {canShowSessions && (
                  <div className="flex-1 overflow-y-auto thin-scrollbar">
                    {threadGroups.map((group) => (
                      <div key={group.title} className="mb-4">
                        <p className="text-xs font-semibold text-gray-400 mb-2">{group.title}</p>

                        <div className="space-y-1">
                          {group.threads.map((thread) => (
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
                                    {thread.title}
                                  </div>
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
                          ))}
                        </div>
                      </div>
                    ))}

                    {threads.length === 0 && (
                      <div className="text-center text-gray-400 text-sm py-8">
                        {activeAgentId
                          ? 'Нет чатов\nНажмите "Новый чат"'
                          : 'Выберите агента\nдля просмотра чатов'}
                      </div>
                    )}
                  </div>
                )}

                {!canShowSessions && activeAgentId && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-gray-400 text-sm">
                      {activeAgentId === 'ocr' && 'Распознавание изображений\nЗагрузите файл для начала'}
                      {activeAgentId === 'tech_rag' && 'Техническая документация\nЗадайте вопрос для начала'}
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