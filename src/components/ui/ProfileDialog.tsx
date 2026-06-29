// src/components/ui/ProfileDialog.tsx
import * as Dialog from "@radix-ui/react-dialog";
import { X, User, Mail, Building2, Save } from "lucide-react";
import { useUserStore } from "../../store/userStore";
import { useState } from "react";

interface ProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Тип для данных профиля (что будем хранить)
interface ProfileFormData {
  name: string;
  email: string;
  department: string;
}

export function ProfileDialog({ isOpen, onClose }: ProfileDialogProps) {
  const user = useUserStore((state) => state.user);
  const updateUser = useUserStore((state) => state.updateUser);

  const [formData, setFormData] = useState<ProfileFormData>({
    name: user?.name || "",
    email: user?.email || "",
    department: user?.department || "",
  });

  // !!! Важно !!!! Не удалять !!!
  // Разкомментировать, когда закончим тестировать модальники
  // Если пользователя нет — не рисуем модалку
  //   if (!user) {
  //     return null;
  //   }

  const handleSave = () => {
    updateUser(formData); // сохраняем в стор
    onClose();
  };

  // Обработчик изменения любого поля
  // Используем "вычисляемое свойство" - [e.target.name] динамически выбирает поле
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev, // сохраняем остальные поля
      [name]: value, // обновляем только то, которое меняется
    }));
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 z-50" />

        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl animate-in fade-in zoom-in duration-200 z-50">
          <Dialog.Close asChild>
            <button className="absolute right-4 top-4 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X size={18} />
            </button>
          </Dialog.Close>

          {/* Заголовок */}
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-full bg-[var(--color-accent)]/10">
              <User size={20} className="text-[var(--color-accent)]" />
            </div>
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
              Профиль пользователя
            </Dialog.Title>
          </div>

          {/* Форма */}
          <form
            onSubmit={(e) => {
              e.preventDefault(); // предотвращаем перезагрузку страницы
              handleSave();
            }}
          >
            <div className="space-y-4">
              {/* Поле Имя */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Имя
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                    placeholder="Ваше имя"
                  />
                </div>
              </div>

              {/* Поле Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              {/* Поле Отдел */}
              <div>
                <label
                  htmlFor="department"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Отдел
                </label>
                <div className="relative">
                  <Building2
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                    placeholder="Ваш отдел"
                  />
                </div>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Отмена
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium rounded-lg bg-[var(--color-accent)] text-white hover:bg-[var(--color-hover)] transition-colors flex items-center gap-2"
              >
                <Save size={16} />
                Сохранить
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
