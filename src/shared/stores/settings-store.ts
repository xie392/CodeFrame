import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '@shared/constants';
import type { UserSettings, OperationHistory } from '@shared/types';

interface SettingsState {
  settings: UserSettings;
  operationHistory: OperationHistory;
  isLoading: boolean;
  
  // 设置操作
  updateSettings: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => void;
  updateSettingsBatch: (updates: Partial<UserSettings>) => void;
  resetSettings: () => void;
  
  // 操作历史
  updateOperationHistory: <K extends keyof OperationHistory>(
    key: K,
    value: OperationHistory[K]
  ) => void;
  clearOperationHistory: () => void;
  
  // 加载状态
  setLoading: (loading: boolean) => void;
}

const defaultSettings: UserSettings = {
  defaultFormat: DEFAULT_SETTINGS.defaultFormat as UserSettings['defaultFormat'],
  quality: DEFAULT_SETTINGS.quality as UserSettings['quality'],
  language: DEFAULT_SETTINGS.language as UserSettings['language'],
  saveOperationHistory: DEFAULT_SETTINGS.saveOperationHistory,
  delayTime: DEFAULT_SETTINGS.delayTime as UserSettings['delayTime'],
  shortcuts: {
    screenshot: 'Alt+Shift+S',
    codegen: 'Alt+Shift+C',
  },
};

const defaultOperationHistory: OperationHistory = {};

// 检测是否在 Chrome Extension 环境中
const isChromeExtension = typeof chrome !== 'undefined' && 
  chrome.storage && 
  typeof chrome.storage.local !== 'undefined';

// 统一存储适配器 - 自动选择 Chrome Storage 或 localStorage
const createStorageAdapter = () => {
  if (isChromeExtension) {
    // Chrome Extension 环境 - 使用 chrome.storage.local
    return {
      getItem: async (name: string): Promise<string | null> => {
        try {
          const result = await chrome.storage.local.get(name);
          const raw = result[name];
          return raw ? JSON.stringify(raw) : null;
        } catch (error) {
          console.error('[CodeFrame] Chrome Storage 读取失败，降级到 localStorage:', error);
          // 降级到 localStorage
          return localStorage.getItem(name);
        }
      },
      setItem: async (name: string, value: string): Promise<void> => {
        try {
          await chrome.storage.local.set({ [name]: JSON.parse(value) });
          // 同时保存到 localStorage 作为备份
          localStorage.setItem(name, value);
        } catch (error) {
          console.error('[CodeFrame] Chrome Storage 写入失败，降级到 localStorage:', error);
          // 降级到 localStorage
          localStorage.setItem(name, value);
        }
      },
      removeItem: async (name: string): Promise<void> => {
        try {
          await chrome.storage.local.remove(name);
          localStorage.removeItem(name);
        } catch (error) {
          console.error('[CodeFrame] Chrome Storage 删除失败，降级到 localStorage:', error);
          localStorage.removeItem(name);
        }
      },
    };
  } else {
    // Web 环境 - 使用 localStorage
    console.log('[CodeFrame] 非 Chrome Extension 环境，使用 localStorage');
    return {
      getItem: (name: string): string | null => {
        return localStorage.getItem(name);
      },
      setItem: (name: string, value: string): void => {
        localStorage.setItem(name, value);
      },
      removeItem: (name: string): void => {
        localStorage.removeItem(name);
      },
    };
  }
};

const storageAdapter = createStorageAdapter();

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      operationHistory: defaultOperationHistory,
      isLoading: true,
      
      updateSettings: (key, value) =>
        set((state) => ({
          settings: { ...state.settings, [key]: value },
        })),
      
      updateSettingsBatch: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
      
      resetSettings: () =>
        set({ settings: defaultSettings }),
      
      updateOperationHistory: (key, value) =>
        set((state) => ({
          operationHistory: { ...state.operationHistory, [key]: value },
        })),
      
      clearOperationHistory: () =>
        set({ operationHistory: defaultOperationHistory }),
      
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      storage: createJSONStorage(() => storageAdapter),
      partialize: (state) => ({
        settings: state.settings,
        operationHistory: state.operationHistory,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setLoading(false);
        }
      },
    }
  )
);
