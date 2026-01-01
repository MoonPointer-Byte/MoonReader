import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ThemeState {
  isDarkMode: boolean;      // 当前是否是黑夜模式
  toggleTheme: () => void;  // 切换模式的方法
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: false, // 默认白天模式
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    }),
    {
      name: 'theme-storage', // 存到 localStorage 的 key
      storage: createJSONStorage(() => localStorage),
    }
  )
);