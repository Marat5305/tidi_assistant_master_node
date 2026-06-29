/**
 * @component SettingsDialog
 * @path src/components/ui/SettingsDialog.tsx
 * @description Модальное окно с настройками приложения
 */

import { ConfirmDialog } from "./ConfirmDialog";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Settings as SettingsIcon, Trash2 } from "lucide-react";
import { useUserStore } from "../../store/userStore";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetAuth = () => {
    // 1. Удаляем флаг из localStorage
    localStorage.removeItem("rag_skip_auth");

    // 2. Сбрасываем пользователя в сторе
    useUserStore.getState().resetUser();

    // 3. (Опционально) Показываем сообщение в консоли
    console.log("[Settings] Настройки входа сброшены");

    // 4. Закрываем модалки
    setShowResetConfirm(false);
    onClose();

    // 5. (Опционально) Перезагружаем страницу, чтобы страница входа появилась
    // Раскомментируй следующую строку, если хочешь перезагрузку:
    // window.location.reload();
  };

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={onClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 z-50" />

          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl animate-in fade-in zoom-in duration-200 z-50">
            <Dialog.Close asChild>
              <button className="absolute right-4 top-4 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X size={18} />
              </button>
            </Dialog.Close>

            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-full bg-[var(--color-accent)]/10">
                <SettingsIcon
                  size={20}
                  className="text-[var(--color-accent)]"
                />
              </div>
              <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                Настройки
              </Dialog.Title>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Trash2
                    size={18}
                    className="text-red-600 dark:text-red-400"
                  />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    Включить окно авторизации
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  (сброс настроек входа)
                </span>
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Диалог подтверждения */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetAuth}
        title="Сбросить настройки входа?"
        description="Это удалит сохранённый флаг «Не показывать окно входа». При следующем запуске страница входа появится снова."
        confirmText="Сбросить"
        cancelText="Отмена"
        confirmVariant="danger"
      />
    </>
  );
}
