// useOperationHistory Hook 测试

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOperationHistory } from '../useOperationHistory';
import { useSettingsStore } from '@shared/stores/settings-store';
import { useCodegenStore } from '../../stores/codegen-store';
import { NATIVE_SHORTCUTS_DEFAULT, CUSTOM_SHORTCUTS_DEFAULT } from '@shared/constants';

// 创建默认快捷键配置
const defaultShortcuts = {
  native: { ...NATIVE_SHORTCUTS_DEFAULT },
  custom: { ...CUSTOM_SHORTCUTS_DEFAULT },
  enabled: true,
};

// 创建默认 store state
const createDefaultState = (overrides = {}) => ({
  settings: {
    defaultFormat: 'png' as const,
    quality: '2x' as const,
    language: 'zh-CN' as const,
    saveOperationHistory: true,
    delayTime: 3 as const,
    shortcuts: defaultShortcuts,
  },
  operationHistory: {},
  updateOperationHistory: vi.fn(),
  isLoading: false,
  updateSettings: vi.fn(),
  updateSettingsBatch: vi.fn(),
  resetSettings: vi.fn(),
  clearOperationHistory: vi.fn(),
  setLoading: vi.fn(),
  updateShortcut: vi.fn(),
  toggleShortcutsEnabled: vi.fn(),
  resetShortcuts: vi.fn(),
  ...overrides,
});

// Mock stores
vi.mock('@shared/stores/settings-store', () => ({
  useSettingsStore: vi.fn((selector) => {
    const state = createDefaultState();
    return selector(state);
  }),
}));

vi.mock('../../stores/codegen-store', () => ({
  useCodegenStore: {
    getState: vi.fn(() => ({
      theme: { selectedTheme: 'dark', selectedBg: 'gradient' },
      editor: { selectedFont: 'mono', fontSize: 14, showLineNumbers: true },
      window: {
        padding: { x: 32, y: 32 },
        borderRadius: 12,
        shadowEnabled: true,
        shadowIntensity: 1,
        showHeader: true,
        fileName: 'test.ts',
      },
      watermark: { enabled: false, text: '', opacity: 0.5 },
      restoreFromHistory: vi.fn(),
    })),
    subscribe: vi.fn(() => vi.fn()),
  },
}));

describe('useOperationHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该返回 historyRestoredRef', () => {
    const { result } = renderHook(() => useOperationHistory());

    expect(result.current.historyRestoredRef).toBeDefined();
    expect(result.current.historyRestoredRef.current).toBe(true);
  });

  it('应该在 saveOperationHistory 为 false 时不恢复历史', () => {
    vi.mocked(useSettingsStore).mockImplementation((selector) => {
      const state = createDefaultState({
        settings: {
          defaultFormat: 'png' as const,
          quality: '2x' as const,
          language: 'zh-CN' as const,
          saveOperationHistory: false,
          delayTime: 3 as const,
          shortcuts: defaultShortcuts,
        },
        operationHistory: { codegen: { selectedTheme: 'light' } },
      });
      return selector(state);
    });

    renderHook(() => useOperationHistory());

    // restoreFromHistory 不应该被调用
    const state = useCodegenStore.getState();
    expect(state.restoreFromHistory).not.toHaveBeenCalled();
  });

  it('应该在 operationHistory.codegen 为 null 时不恢复历史', () => {
    vi.mocked(useSettingsStore).mockImplementation((selector) => {
      const state = createDefaultState({
        operationHistory: {}, // 空对象表示没有 codegen 历史
      });
      return selector(state);
    });

    renderHook(() => useOperationHistory());

    const state = useCodegenStore.getState();
    expect(state.restoreFromHistory).not.toHaveBeenCalled();
  });

  it('应该订阅 store 变化', () => {
    renderHook(() => useOperationHistory());

    expect(useCodegenStore.subscribe).toHaveBeenCalled();
  });
});
