// src/components/chat/ThreadSidebar.tsx
import { useEffect, useMemo, useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import { useUIStore } from '../../store/uiStore';
import { Menu, PanelLeftClose, Search, Plus, Trash2 } from 'lucide-react';
import { groupThreadsByDate, type ThreadGroup } from '../../utils/threadGrouping';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { AgentSelector } from './AgentSelector';
import logo from '../../assets/logo.svg';
import type { Conversation } from '../../types/chat';
import { formatDateShort } from '../../utils/dateFormat';
import ModalRAGSetting from './ModalRAGSetting';

type ThreadWithModel = Conversation & {
  _model: string;
  _modelName: string;
};

export function ThreadSidebar() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  const modelsList = useChatStore((s) => s.models_list);
  const currentConversationId = useChatStore((s) => s.currentConversation_id);
  const activeModel = useChatStore((s) => s.model);
  const createConversation = useChatStore((s) => s.createConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const getAllModelsConversations = useChatStore(
    (s) => s.getAllModelsConversations,
  );

  // Локальный фильтр — не меняет активного агента
  const [selectedFilterModel, setSelectedFilterModel] = useState<string | null>(
    null,
  );
  const [threadGroups, setThreadGroups] = useState<ThreadGroup[]>([]);
  const [threadToDelete, setThreadToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isModalRAGOpen, setIsModalRAGOpen] = useState(false);

  // Грузим все беседы всех агентов при монтировании
  useEffect(() => {
    getAllModelsConversations();
  }, [getAllModelsConversations]);

  // Разворачиваем models_list в плоский список бесед с инфо об агенте
  const allThreads = useMemo<ThreadWithModel[]>(() => {
    if (!Array.isArray(modelsList)) return [];

    const result: ThreadWithModel[] = [];
    for (const entry of modelsList) {
      if (!entry || !Array.isArray(entry.conversations)) continue;
      for (const conversation of entry.conversations) {
        result.push({
          ...conversation,
          _model: entry.model,
          _modelName: entry.model_name,
        });
      }
    }

    // Свежие сверху
    result.sort((a, b) => {
      const ta = a.created_at ? Date.parse(a.created_at) : 0;
      const tb = b.created_at ? Date.parse(b.created_at) : 0;
      return tb - ta;
    });

    return result;
  }, [modelsList]);

  // Фильтр по агенту — только для отображения
  const filteredThreads = useMemo(() => {
    if (!selectedFilterModel) return allThreads;
    return allThreads.filter((t) => t._model === selectedFilterModel);
  }, [allThreads, selectedFilterModel]);

  useEffect(() => {
    setThreadGroups(groupThreadsByDate(filteredThreads));
  }, [filteredThreads]);

  const handleNewChat = async () => {
    // Создаём у активного агента. Если агент не выбран — берём первого из фильтра.
    const targetModel = activeModel || selectedFilterModel;
    if (!targetModel) {
      console.warn('⚠️ Выберите агента перед созданием чата');
      return;
    }

    // Если активный агент не совпадает с фильтром — переключаем
    if (targetModel !== activeModel) {
      useChatStore.getState().setModel(targetModel);
    }

    await createConversation();
    // Обновим общий список, чтобы новый чат появился в сайдбаре
    await getAllModelsConversations();
  };

  const handleThreadClick = async (conversationId: string) => {
    try {
      await setActiveConversation(conversationId);
    } catch (e) {
      console.error('❌ Ошибка активации беседы:', e);
    }
  };

  const handleDeleteClick = (
    e: React.MouseEvent,
    id: string,
    title: string,
  ) => {
    e.stopPropagation();
    setThreadToDelete({ id, title });
  };

  const handleConfirmDelete = async () => {
    if (!threadToDelete) return;
    const id = threadToDelete.id;
    setThreadToDelete(null);
    await deleteConversation(id);
    await getAllModelsConversations();
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
                    <h2 className="text-2xl font-bold italic tracking-wide text-gradient-logo">
                      тиди
                    </h2>
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

                <AgentSelector
                  selectedFilterModel={selectedFilterModel}
                  onFilterChange={setSelectedFilterModel}
                />

                <button
                  onClick={handleNewChat}
                  disabled={!activeModel && !selectedFilterModel}
                  className={`w-full mb-4 px-3 py-2 flex items-center gap-2 text-sm rounded-lg shadow-sm border border-gray-200 transition-all
                    ${activeModel || selectedFilterModel
                      ? 'text-gray-500 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:shadow-md'
                      : 'text-gray-300 cursor-not-allowed opacity-50'
                    }`}
                >
                  <Plus size={16} />
                  Новый чат
                </button>
                <button 
                      className={`w-full mb-4 px-3 py-2 flex items-center gap-2 
                      bg-[var(--color-primary)]/50
                      text-sm rounded-lg shadow-sm border border-gray-200 transition-all
                      text-white-500 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:shadow-md`}
                      onClick={() => setIsModalRAGOpen(true)}>
                  Создать RAG
                </button>
                <ModalRAGSetting isOpen={isModalRAGOpen} onClose={() => setIsModalRAGOpen(false)} />

                {filteredThreads.length > 0 ? (
                  <div className="flex-1 overflow-y-auto thin-scrollbar">
                    {threadGroups.map((group) => (
                      <div key={group.title} className="mb-4">
                        <p className="text-xs font-semibold text-gray-400 mb-2">
                          {group.title}
                        </p>

                        <div className="space-y-1">
                          {group.threads.map((thread) => {
                            const modelName = (thread as any)._modelName;
                            const title =
                              thread.name ??
                              (thread.created_at
                                ? formatDateShort(thread.created_at)
                                : 'Без названия');

                            return (
                              <div
                                key={thread.id}
                                onClick={() => handleThreadClick(thread.id)}
                                className={`
                                  group relative px-3 py-2 rounded-lg cursor-pointer transition-all
                                  ${currentConversationId === thread.id
                                    ? 'bg-[var(--color-accent)]/50 dark:bg-blue-900/50'
                                    : 'hover:bg-[var(--color-accent)]/15 dark:hover:bg-gray-800'
                                  }
                                `}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">
                                      {title}
                                    </div>
                                    {!selectedFilterModel && modelName && (
                                      <div className="text-xs text-gray-400 truncate">
                                        {modelName}
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    onClick={(e) =>
                                      handleDeleteClick(
                                        e,
                                        thread.id,
                                        title,
                                      )
                                    }
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
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
                      {!selectedFilterModel
                        ? 'Выберите агента\nдля просмотра чатов'
                        : 'Нет чатов'}
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
        onClose={() => setThreadToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Удалить чат?"
        description={`Вы уверены, что хотите удалить чат "${threadToDelete?.title ?? ''}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        confirmVariant="danger"
      />
    </>
  );
}