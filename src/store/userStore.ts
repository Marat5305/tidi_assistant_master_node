// src/store/userStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Тип для данных пользователя
interface User {
  name: string;
  email: string;
  department: string;
  avatar?: string; // на будущее
}

interface UserState {
  user: User | null;
  isLoaded: boolean; // загружены ли данные (для индикатора загрузки)
}

interface UserActions {
  updateUser: (updates: Partial<User>) => void;
  loadUser: () => Promise<void>; // для загрузки с сервера
  resetUser: () => void;
}

type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()(
  devtools(
    (set) => ({
      // Начальное состояние — пользователь не залогинен
      user: null,  // ← теперь null
      isLoaded: false,

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : { ...updates } as User,
        })),

      loadUser: async () => {
        // Заглушка — пока ничего не загружаем
        await new Promise(resolve => setTimeout(resolve, 500));
        set({ isLoaded: true });
      },

      resetUser: () => set({ user: null, isLoaded: false }),  // ← теперь null
    }),
    { name: 'user-store' }
  )
);