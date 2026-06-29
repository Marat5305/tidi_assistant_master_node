import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  isSidebarOpen: boolean;
  theme: Theme;
  activeModal: string | null;
  inputValue: string;
  isLoading: boolean;
  activeAgent: string | null;

}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: Theme) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  setInputValue: (value: string) => void;
  setLoading: (loading: boolean) => void;
  resetUI: () => void;
  sidebarOpen: boolean;
  setActiveAgent: (agentId: string | null) => void;
}

type UIStore = UIState & UIActions;

const applyTheme = (theme: Theme): void => {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  document.documentElement.classList.toggle('dark', isDark);
};

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      isSidebarOpen: false,
      theme: 'system',
      activeModal: null,
      inputValue: '',
      isLoading: false,
      sidebarOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      activeAgent: null,
      setActiveAgent: (agentId) => set({ activeAgent: agentId }),

      setSidebarOpen: (open: boolean) => {
        set({ isSidebarOpen: open });
      },

      setTheme: (theme: Theme) => {
        set({ theme });
        applyTheme(theme);
      },

      openModal: (modalId: string) => {
        set({ activeModal: modalId });
      },

      closeModal: () => {
        set({ activeModal: null });
      },

      setInputValue: (value: string) => {
        set({ inputValue: value });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      resetUI: () => {
        set({
          isSidebarOpen: true,
          activeModal: null,
          inputValue: '',
          isLoading: false,
        });
      },
    }),
    { name: 'ui-store' }
  )
);

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      const { theme } = useUIStore.getState();
      if (theme === 'system') {
        applyTheme('system');
      }
    });
}

