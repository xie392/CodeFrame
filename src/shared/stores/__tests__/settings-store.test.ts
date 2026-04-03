// Settings Store 测试

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useSettingsStore } from '../settings-store';

describe('SettingsStore', () => {
  beforeEach(() => {
    // 重置 store 到默认状态
    act(() => {
      useSettingsStore.setState({
        settings: {
          defaultFormat: 'png',
          quality: '2x',
          language: 'zh-CN',
          saveOperationHistory: true,
          delayTime: 3,
          historyRetention: 30,
          watermarkEnabled: false,
          watermarkText: '',
          watermarkOpacity: 50,
          codeTheme: 'github-dark',
          codeFontSize: 14,
          codeShowLineNumbers: true,
          shortcuts: {
            screenshot: 'Alt+Shift+S',
            codegen: 'Alt+Shift+C',
          },
        },
        operationHistory: {},
        isLoading: false,
      });
    });
  });

  describe('设置操作', () => {
    it('应该能够更新单个设置', () => {
      act(() => {
        useSettingsStore.getState().updateSettings('quality', '3x');
      });

      expect(useSettingsStore.getState().settings.quality).toBe('3x');
    });

    it('应该能够更新语言设置', () => {
      act(() => {
        useSettingsStore.getState().updateSettings('language', 'en-US');
      });

      expect(useSettingsStore.getState().settings.language).toBe('en-US');
    });

    it('应该能够更新水印设置', () => {
      act(() => {
        useSettingsStore.getState().updateSettings('watermarkEnabled', true);
        useSettingsStore.getState().updateSettings('watermarkText', 'My Brand');
        useSettingsStore.getState().updateSettings('watermarkOpacity', 30);
      });

      const state = useSettingsStore.getState();
      expect(state.settings.watermarkEnabled).toBe(true);
      expect(state.settings.watermarkText).toBe('My Brand');
      expect(state.settings.watermarkOpacity).toBe(30);
    });

    it('应该能够批量更新设置', () => {
      act(() => {
        useSettingsStore.getState().updateSettingsBatch({
          quality: '1x',
          defaultFormat: 'jpg',
          language: 'en-US',
        });
      });

      const state = useSettingsStore.getState();
      expect(state.settings.quality).toBe('1x');
      expect(state.settings.defaultFormat).toBe('jpg');
      expect(state.settings.language).toBe('en-US');
    });

    it('应该能够重置设置为默认值', () => {
      act(() => {
        useSettingsStore.getState().updateSettings('quality', '3x');
        useSettingsStore.getState().updateSettings('language', 'en-US');
      });

      act(() => {
        useSettingsStore.getState().resetSettings();
      });

      const state = useSettingsStore.getState();
      expect(state.settings.quality).toBe('2x');
      expect(state.settings.language).toBe('zh-CN');
    });
  });

  describe('操作历史', () => {
    it('应该能够更新操作历史', () => {
      act(() => {
        useSettingsStore.getState().updateOperationHistory('codegen', {
          selectedTheme: 'monokai',
          fontSize: 14,
        });
      });

      const history = useSettingsStore.getState().operationHistory;
      expect(history.codegen).toEqual({
        selectedTheme: 'monokai',
        fontSize: 14,
      });
    });

    it('应该能够清空操作历史', () => {
      act(() => {
        useSettingsStore.getState().updateOperationHistory('codegen', {
          selectedTheme: 'monokai',
        });
      });

      act(() => {
        useSettingsStore.getState().clearOperationHistory();
      });

      const history = useSettingsStore.getState().operationHistory;
      expect(history).toEqual({});
    });
  });

  describe('加载状态', () => {
    it('应该能够设置加载状态', () => {
      act(() => {
        useSettingsStore.getState().setLoading(true);
      });

      expect(useSettingsStore.getState().isLoading).toBe(true);

      act(() => {
        useSettingsStore.getState().setLoading(false);
      });

      expect(useSettingsStore.getState().isLoading).toBe(false);
    });
  });
});
