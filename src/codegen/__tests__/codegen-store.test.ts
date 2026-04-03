// Codegen Store 单元测试

import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useCodegenStore } from '../stores/codegen-store';

describe('CodegenStore', () => {
  beforeEach(() => {
    // 重置 store 到初始状态
    act(() => {
      useCodegenStore.setState({
        theme: {
          selectedTheme: 'vscode-dark',
          selectedBg: 'indigo',
          customBgColor: '#6366F1',
        },
        window: {
          padding: { top: 32, right: 32, bottom: 32, left: 32 },
          borderRadius: { outer: 12, inner: 8 },
          shadowEnabled: true,
          shadowIntensity: 50,
          showHeader: true,
          fileName: 'greet.js',
        },
        editor: {
          code: 'console.log("Hello, World!");',
          showLineNumbers: true,
          selectedFont: 'jetbrains',
          fontSize: 13,
        },
        watermark: {
          enabled: false,
          text: 'CodeFrame',
          opacity: 50,
        },
        canvas: {
          scale: 1,
          offset: { x: 0, y: 0 },
        },
        isEditing: false,
        winSize: { width: 520, height: 400 },
        manualResized: false,
      });
    });
  });

  describe('Theme Actions', () => {
    it('应该能够设置主题', () => {
      act(() => {
        useCodegenStore.getState().setTheme({ selectedTheme: 'github-dark' });
      });

      const state = useCodegenStore.getState();
      expect(state.theme.selectedTheme).toBe('github-dark');
    });

    it('应该能够设置背景', () => {
      act(() => {
        useCodegenStore.getState().setTheme({ selectedBg: 'gradient-sunset' });
      });

      const state = useCodegenStore.getState();
      expect(state.theme.selectedBg).toBe('gradient-sunset');
    });

    it('应该能够设置自定义背景颜色', () => {
      act(() => {
        useCodegenStore.getState().setTheme({ customBgColor: '#FF5733' });
      });

      const state = useCodegenStore.getState();
      expect(state.theme.customBgColor).toBe('#FF5733');
    });
  });

  describe('Window Actions', () => {
    it('应该能够设置内边距', () => {
      act(() => {
        useCodegenStore.getState().setWindow({
          padding: { top: 48, right: 48, bottom: 48, left: 48 },
        });
      });

      const state = useCodegenStore.getState();
      expect(state.window.padding.top).toBe(48);
      expect(state.window.padding.right).toBe(48);
    });

    it('应该能够设置圆角', () => {
      act(() => {
        useCodegenStore.getState().setWindow({
          borderRadius: { outer: 16, inner: 12 },
        });
      });

      const state = useCodegenStore.getState();
      expect(state.window.borderRadius.outer).toBe(16);
      expect(state.window.borderRadius.inner).toBe(12);
    });

    it('应该能够切换阴影', () => {
      act(() => {
        useCodegenStore.getState().setWindow({ shadowEnabled: false });
      });

      expect(useCodegenStore.getState().window.shadowEnabled).toBe(false);
    });

    it('应该能够设置文件名', () => {
      act(() => {
        useCodegenStore.getState().setWindow({ fileName: 'test.ts' });
      });

      expect(useCodegenStore.getState().window.fileName).toBe('test.ts');
    });
  });

  describe('Editor Actions', () => {
    it('应该能够设置代码', () => {
      act(() => {
        useCodegenStore.getState().setEditor({ code: 'const x = 1;' });
      });

      expect(useCodegenStore.getState().editor.code).toBe('const x = 1;');
    });

    it('应该能够设置字体大小', () => {
      act(() => {
        useCodegenStore.getState().setEditor({ fontSize: 16 });
      });

      expect(useCodegenStore.getState().editor.fontSize).toBe(16);
    });

    it('应该能够切换行号显示', () => {
      act(() => {
        useCodegenStore.getState().setEditor({ showLineNumbers: false });
      });

      expect(useCodegenStore.getState().editor.showLineNumbers).toBe(false);
    });
  });

  describe('Watermark Actions', () => {
    it('应该能够启用水印', () => {
      act(() => {
        useCodegenStore.getState().setWatermark({ enabled: true });
      });

      expect(useCodegenStore.getState().watermark.enabled).toBe(true);
    });

    it('应该能够设置水印文本', () => {
      act(() => {
        useCodegenStore.getState().setWatermark({ text: 'My Brand' });
      });

      expect(useCodegenStore.getState().watermark.text).toBe('My Brand');
    });

    it('应该能够设置水印透明度', () => {
      act(() => {
        useCodegenStore.getState().setWatermark({ opacity: 30 });
      });

      expect(useCodegenStore.getState().watermark.opacity).toBe(30);
    });
  });

  describe('Canvas Actions', () => {
    it('应该能够设置缩放比例', () => {
      act(() => {
        useCodegenStore.getState().setCanvas({ scale: 2 });
      });

      expect(useCodegenStore.getState().canvas.scale).toBe(2);
    });

    it('应该能够设置偏移量', () => {
      act(() => {
        useCodegenStore.getState().setCanvas({ offset: { x: 100, y: 50 } });
      });

      const state = useCodegenStore.getState();
      expect(state.canvas.offset.x).toBe(100);
      expect(state.canvas.offset.y).toBe(50);
    });
  });

  describe('编辑状态 Actions', () => {
    it('应该能够设置编辑状态', () => {
      act(() => {
        useCodegenStore.getState().setIsEditing(true);
      });

      expect(useCodegenStore.getState().isEditing).toBe(true);
    });

    it('应该能够设置窗口大小', () => {
      act(() => {
        useCodegenStore.getState().setWinSize({ width: 800, height: 600 });
      });

      const state = useCodegenStore.getState();
      expect(state.winSize.width).toBe(800);
      expect(state.winSize.height).toBe(600);
    });

    it('应该能够设置手动调整大小标志', () => {
      act(() => {
        useCodegenStore.getState().setManualResized(true);
      });

      expect(useCodegenStore.getState().manualResized).toBe(true);
    });
  });

  describe('历史恢复功能', () => {
    it('应该能够从历史记录恢复状态', () => {
      const savedState = {
        selectedTheme: 'github-light',
        selectedBg: 'gradient-ocean',
        selectedFont: 'fira-code',
        fontSize: 14,
        showLineNumbers: false,
        padding: { top: 64, right: 64, bottom: 64, left: 64 },
        shadowEnabled: false,
        watermarkEnabled: true,
        watermarkText: 'Restored',
      };

      act(() => {
        useCodegenStore.getState().restoreFromHistory(savedState);
      });

      const state = useCodegenStore.getState();
      expect(state.theme.selectedTheme).toBe('github-light');
      expect(state.theme.selectedBg).toBe('gradient-ocean');
      expect(state.editor.selectedFont).toBe('fira-code');
      expect(state.editor.fontSize).toBe(14);
      expect(state.editor.showLineNumbers).toBe(false);
      expect(state.window.padding.top).toBe(64);
      expect(state.window.shadowEnabled).toBe(false);
      expect(state.watermark.enabled).toBe(true);
      expect(state.watermark.text).toBe('Restored');
    });

    it('getHistoryState 应该返回当前状态快照', () => {
      act(() => {
        useCodegenStore.getState().setTheme({ selectedTheme: 'monokai' });
        useCodegenStore.getState().setEditor({ fontSize: 18 });
      });

      const historyState = useCodegenStore.getState().getHistoryState();

      expect(historyState.selectedTheme).toBe('monokai');
      expect(historyState.fontSize).toBe(18);
    });
  });
});
