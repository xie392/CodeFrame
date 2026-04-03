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
  historyRetention: DEFAULT_SETTINGS.historyRetention as UserSettings['historyRetention'],
  watermarkEnabled: DEFAULT_SETTINGS.watermarkEnabled,
  watermarkText: DEFAULT_SETTINGS.watermarkText,
  watermarkOpacity: DEFAULT_SETTINGS.watermarkOpacity,
  codeTheme: DEFAULT_SETTINGS.codeTheme,
  codeFontSize: DEFAULT_SETTINGS.codeFontSize,
  codeShowLineNumbers: DEFAULT_SETTINGS.codeShowLineNumbers,
  shortcuts: {
    screenshot: 'Alt+Shift+S',
    codegen: 'Alt+Shift+C',
  },
};

const defaultOperationHistory: OperationHistory = {};

// Chrome 存储适配器
const chromeStorage = {
  getItem: async (name: string) => {
    const result = await chrome.storage.local.get(name);
    const raw = result[name];
    return raw ? JSON.stringify(raw) : null;
  },
  setItem: async (name: string, value: string) => {
    try {
      await chrome.storage.local.set({ [name]: JSON.parse(value) });
    } catch (error) {
      console.error('[CodeFrame] 保存设置失败:', error);
    }
  },
  removeItem: async (name: string) => {
    await chrome.storage.local.remove(name);
  },
};

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
      storage: createJSONStorage(() => chromeStorage),
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
