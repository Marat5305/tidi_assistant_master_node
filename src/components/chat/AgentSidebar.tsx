// src/components/chat/AgentSidebar.tsx
import { useUIStore } from '../../store/uiStore';
import { AGENTS } from '../../config/agents';
import { User, Settings, MessageCircle } from 'lucide-react';
import { ProfileDialog } from '../ui/ProfileDialog';
import { SettingsDialog } from '../ui/SettingsDialog';
import { useChatStore } from '../../store/chatStore';

export function AgentSidebar() {
  const setModel = useChatStore((s) => s.setModel);
  const model = useChatStore((s) => s.model);
  const createConversation = useChatStore((s) => s.createConversation);
  const getAllModelsConversations = useChatStore(
    (s) => s.getAllModelsConversations,
  );

  const activeModal = useUIStore((s) => s.activeModal);
  const openModal = useUIStore((s) => s.openModal);
  const closeModal = useUIStore((s) => s.closeModal);

  const handleProfileClick = () => openModal('profile');
  const handleSettingsClick = () => openModal('settings');

  // Создаём беседу у выбранного агента
  const handleAgentClick = async (id: string) => {
    // Переключаем модель (setModel сам подгрузит беседы)
    setModel(id);

    try {
      await createConversation();
      // Обновим общий список, чтобы новый чат появился в ThreadSidebar
      await getAllModelsConversations();
    } catch (err) {
      console.error('❌ Не удалось создать беседу:', err);
    }
  };

  return (
    <>
      <aside className="w-24 h-full flex flex-col items-center py-4 border-l border-[var(--color-accent)] bg-white dark:bg-gray-900">
        {/* Профиль */}
        <button
          onClick={handleProfileClick}
          className="flex flex-col items-center gap-1 mb-6 p-1 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-accent)] flex items-center justify-center">
            <User size={22} className="text-[var(--color-accent)]" />
          </div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight text-center">
            Профиль
          </span>
        </button>

        <div className="w-12 h-px bg-[var(--color-surface)] mb-4" />

        {/* Агенты */}
        <div className="flex flex-col gap-3">
          {AGENTS.map((agent) => {
            const isActive = model === agent.id;
            const Icon = agent.icon;

            return (
              <button
                key={agent.id}
                onClick={() => handleAgentClick(agent.id)}
                className={`
                  flex flex-col items-center gap-1 p-2 rounded-xl transition-all
                  hover:scale-105
                  ${
                    isActive
                      ? 'bg-[var(--color-accent)] text-white shadow-md'
                      : 'text-gray-500 hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)]'
                  }
                `}
                title={agent.description}
              >
                {Icon && <Icon size={22} />}
                <span className="text-[10px] leading-tight text-center">
                  {agent.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Нижние кнопки */}
        <div className="mt-auto flex flex-col items-center gap-3 pb-4">
          <button
            onClick={handleSettingsClick}
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-gray-500 hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition-all hover:scale-105"
            title="Настройки"
          >
            <Settings size={20} />
            <span className="text-[10px] leading-tight text-center">
              Настройки
            </span>
          </button>

          <button
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-gray-500 hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] transition-all hover:scale-105"
            title="Обратиться к разработчикам"
          >
            <MessageCircle size={20} />
            <span className="text-[10px] leading-tight text-center">
              Поддержка
            </span>
          </button>
        </div>
      </aside>

      <ProfileDialog
        isOpen={activeModal === 'profile'}
        onClose={closeModal}
      />

      <SettingsDialog
        isOpen={activeModal === 'settings'}
        onClose={closeModal}
      />
    </>
  );
}