import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';
type Space = 'buyer' | 'seller' | 'admin';

interface AppState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  currentSpace: Space;
  setCurrentSpace: (space: Space) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  notifications: any[];
  setNotifications: (notifications: any[]) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setTheme: (theme) => set({ theme }),
      currentSpace: 'buyer',
      setCurrentSpace: (space) => set({ currentSpace: space }),
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      notifications: [],
      setNotifications: (notifications) => set({ notifications }),
      unreadCount: 0,
      setUnreadCount: (count) => set({ unreadCount: count }),
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'sellizi-app-store',
      partialize: (state) => ({ theme: state.theme, currentSpace: state.currentSpace }),
    }
  )
);
