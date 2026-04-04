import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  NATIVE_SHORTCUTS_DEFAULT,
  CUSTOM_SHORTCUTS_DEFAULT,
} from '@shared/constants';
import type {
  UserSettings,
  OperationHistory,
  ShortcutCommand,
} from '@shared/types';

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
  
  // 快捷键操作
  updateShortcut: (command: ShortcutCommand, shortcut: string) => void;
  toggleShortcutsEnabled: (enabled: boolean) => void;
  resetShortcuts: () => void;
  
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
    native: { ...NATIVE_SHORTCUTS_DEFAULT },
    custom: { ...CUSTOM_SHORTCUTS_DEFAULT },
    enabled: true,
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

/**
 * 检测并迁移旧版快捷键配置
 * 旧格式: { screenshot: string, codegen: string }
 * 新格式: { native: {...}, custom: {...}, enabled: boolean }
 */
function migrateShortcutConfig(
  shortcuts: unknown
): UserSettings['shortcuts'] {
  // 如果已经是新格式，直接返回
  if (
    shortcuts &&
    typeof shortcuts === 'object' &&
    'native' in shortcuts &&
    'custom' in shortcuts &&
    'enabled' in shortcuts
  ) {
    return shortcuts as UserSettings['shortcuts'];
  }

  // 如果是旧格式，迁移到新格式
  // eslint-disable-next-line no-console
  console.log('[CodeFrame] 迁移快捷键配置到新格式');
  return {
    native: { ...NATIVE_SHORTCUTS_DEFAULT },
    custom: { ...CUSTOM_SHORTCUTS_DEFAULT },
    enabled: true,
  };
}

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
      
      updateShortcut: (command, shortcut) =>
        set((state) => ({
          settings: {
            ...state.settings,
            shortcuts: {
              ...state.settings.shortcuts,
              custom: {
                ...state.settings.shortcuts.custom,
                [command]: shortcut,
              },
            },
          },
        })),
      
      toggleShortcutsEnabled: (enabled) =>
        set((state) => ({
          settings: {
            ...state.settings,
            shortcuts: {
              ...state.settings.shortcuts,
              enabled,
            },
          },
        })),
      
      resetShortcuts: () =>
        set((state) => ({
          settings: {
            ...state.settings,
            shortcuts: {
              ...state.settings.shortcuts,
              custom: { ...CUSTOM_SHORTCUTS_DEFAULT },
            },
          },
        })),
      
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
          // 迁移快捷键配置
          state.settings.shortcuts = migrateShortcutConfig(
            state.settings.shortcuts
          );
          state.setLoading(false);
        }
      },
    }
  )
);
