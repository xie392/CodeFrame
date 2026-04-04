// useOperationHistory Hook 测试

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOperationHistory } from '../useOperationHistory';
import { useSettingsStore } from '@shared/stores/settings-store';
import { useCodegenStore } from '../../stores/codegen-store';

// Mock stores
vi.mock('@shared/stores/settings-store', () => ({
  useSettingsStore: vi.fn((selector) => {
    const state = {
      settings: {
        defaultFormat: 'png' as const,
        quality: '2x' as const,
        language: 'zh-CN' as const,
        saveOperationHistory: true,
        delayTime: 3 as const,
        historyRetention: 30 as const,
        watermarkEnabled: false,
        watermarkText: '',
        watermarkOpacity: 0.5,
        codeTheme: 'one-dark',
        codeFontSize: 14,
        codeShowLineNumbers: true,
        shortcuts: { screenshot: 'Alt+Shift+S', codegen: 'Alt+Shift+C' },
      },
      operationHistory: { codegen: null },
      updateOperationHistory: vi.fn(),
      isLoading: false,
      updateSettings: vi.fn(),
      updateSettingsBatch: vi.fn(),
      resetSettings: vi.fn(),
      clearOperationHistory: vi.fn(),
      setLoading: vi.fn(),
    };
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
      const state = {
        settings: {
          defaultFormat: 'png' as const,
          quality: '2x' as const,
          language: 'zh-CN' as const,
          saveOperationHistory: false,
          delayTime: 3 as const,
          historyRetention: 30 as const,
          watermarkEnabled: false,
          watermarkText: '',
          watermarkOpacity: 0.5,
          codeTheme: 'one-dark',
          codeFontSize: 14,
          codeShowLineNumbers: true,
          shortcuts: { screenshot: 'Alt+Shift+S', codegen: 'Alt+Shift+C' },
        },
        operationHistory: { codegen: { selectedTheme: 'light' } },
        updateOperationHistory: vi.fn(),
        isLoading: false,
        updateSettings: vi.fn(),
        updateSettingsBatch: vi.fn(),
        resetSettings: vi.fn(),
        clearOperationHistory: vi.fn(),
        setLoading: vi.fn(),
      };
      return selector(state);
    });

    renderHook(() => useOperationHistory());

    // restoreFromHistory 不应该被调用
    const state = useCodegenStore.getState();
    expect(state.restoreFromHistory).not.toHaveBeenCalled();
  });

  it('应该在 operationHistory.codegen 为 null 时不恢复历史', () => {
    vi.mocked(useSettingsStore).mockImplementation((selector) => {
      const state = {
        settings: {
          defaultFormat: 'png' as const,
          quality: '2x' as const,
          language: 'zh-CN' as const,
          saveOperationHistory: true,
          delayTime: 3 as const,
          historyRetention: 30 as const,
          watermarkEnabled: false,
          watermarkText: '',
          watermarkOpacity: 0.5,
          codeTheme: 'one-dark',
          codeFontSize: 14,
          codeShowLineNumbers: true,
          shortcuts: { screenshot: 'Alt+Shift+S', codegen: 'Alt+Shift+C' },
        },
        operationHistory: { codegen: undefined },
        updateOperationHistory: vi.fn(),
        isLoading: false,
        updateSettings: vi.fn(),
        updateSettingsBatch: vi.fn(),
        resetSettings: vi.fn(),
        clearOperationHistory: vi.fn(),
        setLoading: vi.fn(),
      };
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
