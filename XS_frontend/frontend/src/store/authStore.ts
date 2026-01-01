import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
// 请确保这里引入了正确的 UserInfo 类型，或者直接在这里定义
import type { UserInfo } from '../types'; 

interface AuthState {
  token: string | null;
  userInfo: UserInfo | null;
  setLogin: (token: string, userInfo: UserInfo) => void;
  logout: () => void;
  // === 新增：用于更新用户信息的接口定义 ===
  setUserInfo: (userInfo: UserInfo) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userInfo: null,

      setLogin: (token, userInfo) => {
        set({ token, userInfo });
      },

      logout: () => {
        set({ token: null, userInfo: null });
      },

      // === 新增：方法的具体实现 ===
      setUserInfo: (userInfo) => {
        set({ userInfo });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);