// src/components/ui/ConfirmDialog.tsx
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;           // Открыта ли модалка
  onClose: () => void;       // Что делать при закрытии
  onConfirm: () => void;     // Что делать при подтверждении
  title: string;             // Заголовок: "Удалить чат?"
  description: string;       // Описание: "Это действие нельзя отменить"
  confirmText?: string;      // Текст на кнопке подтверждения (по умолчанию "Удалить")
  cancelText?: string;       // Текст на кнопке отмены (по умолчанию "Отмена")
  confirmVariant?: 'danger' | 'primary'; // Цвет кнопки подтверждения
}

/**
 * Переиспользуемый компонент подтверждения действий
 * Использует Radix Dialog для доступной модалки с порталом
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Удалить',
  cancelText = 'Отмена',
  confirmVariant = 'danger',
}: ConfirmDialogProps) {
  
  // Обработчик подтверждения
  const handleConfirm = () => {
    onConfirm();   // Вызываем действие (например, удаление треда)
    onClose();     // Закрываем модалку
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      {/* Portal — перемещает модалку в body, чтобы она была поверх всего */}
      <Dialog.Portal>
        
        {/* Overlay — затемнение фона */}
        <Dialog.Overlay 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 z-50"
          // fixed inset-0 = растянуть на весь экран
          // bg-black/50 = чёрный полупрозрачный фон
          // backdrop-blur-sm = размытие фона
          // animate-in fade-in = плавное появление (Tailwind анимация)
        />
        
        {/* Content — сама модалка */}
        <Dialog.Content 
          className={`
            fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
            w-full max-w-md p-6
            bg-white dark:bg-gray-800 rounded-lg shadow-xl
            animate-in fade-in zoom-in duration-200
            z-50
          `}
          // fixed + left-1/2 top-1/2 + -translate-x-1/2 -translate-y-1/2 = центрирование
          // max-w-md = максимальная ширина 448px
          // z-50 = высокий z-index, чтобы быть поверх оверлея
        >
          
          {/* Кнопка закрытия (крестик в углу) */}
          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Закрыть"
            >
              <X size={18} />
            </button>
          </Dialog.Close>
          
          {/* Заголовок модалки */}
          <Dialog.Title className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            {title}
          </Dialog.Title>
          
          {/* Описание модалки */}
          <Dialog.Description className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            {description}
          </Dialog.Description>
          
          {/* Кнопки действий */}
          <div className="flex gap-3 justify-end">
            {/* Кнопка отмены */}
            <Dialog.Close asChild>
              <button
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {cancelText}
              </button>
            </Dialog.Close>
            
            {/* Кнопка подтверждения (с разными цветами в зависимости от variant) */}
            <button
              onClick={handleConfirm}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${confirmVariant === 'danger' 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-[var(--color-accent)] hover:bg-[var(--color-hover)] text-white'
                }
              `}
            >
              {confirmText}
            </button>
          </div>
          
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}