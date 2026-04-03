/**
 * CodeGen 模块状态管理
 * 使用 Zustand 集中管理所有状态
 */

import { create } from 'zustand';
import {
  DEFAULT_CODE,
  DEFAULT_PADDING,
  DEFAULT_OUTER_BORDER_RADIUS,
  DEFAULT_INNER_BORDER_RADIUS,
  FONT_OPTIONS,
} from '../constants';
import type { Padding } from '../utils/layout';

// ---------------------------------------------------------------------------
// 状态接口定义
// ---------------------------------------------------------------------------

export interface ThemeState {
  selectedTheme: string;
  selectedBg: string;
  customBgColor: string;
}

export interface WindowState {
  padding: Padding;
  borderRadius: {
    outer: number;
    inner: number;
  };
  shadowEnabled: boolean;
  shadowIntensity: number;
  showHeader: boolean;
  fileName: string;
}

export interface EditorState {
  code: string;
  showLineNumbers: boolean;
  selectedFont: string;
  fontSize: number;
}

export interface WatermarkState {
  enabled: boolean;
  text: string;
  opacity: number;
}

export interface CanvasState {
  scale: number;
  offset: { x: number; y: number };
}

export interface CodegenState {
  // 状态分组
  theme: ThemeState;
  window: WindowState;
  editor: EditorState;
  watermark: WatermarkState;
  canvas: CanvasState;

  // 编辑状态
  isEditing: boolean;
  winSize: { width: number; height: number };
  manualResized: boolean;

  // Actions
  setTheme: (theme: Partial<ThemeState>) => void;
  setWindow: (window: Partial<WindowState>) => void;
  setEditor: (editor: Partial<EditorState>) => void;
  setWatermark: (watermark: Partial<WatermarkState>) => void;
  setCanvas: (canvas: Partial<CanvasState>) => void;

  // 编辑状态 Actions
  setIsEditing: (isEditing: boolean) => void;
  setWinSize: (size: { width: number; height: number }) => void;
  setManualResized: (manualResized: boolean) => void;

  // 批量恢复
  restoreFromHistory: (saved: Record<string, unknown>) => void;
  getHistoryState: () => Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 初始状态
// ---------------------------------------------------------------------------

const initialTheme: ThemeState = {
  selectedTheme: 'vscode-dark',
  selectedBg: 'indigo',
  customBgColor: '#6366F1',
};

const initialWindow: WindowState = {
  padding: { ...DEFAULT_PADDING },
  borderRadius: {
    outer: DEFAULT_OUTER_BORDER_RADIUS,
    inner: DEFAULT_INNER_BORDER_RADIUS,
  },
  shadowEnabled: true,
  shadowIntensity: 50,
  showHeader: true,
  fileName: 'greet.js',
};

const initialEditor: EditorState = {
  code: DEFAULT_CODE,
  showLineNumbers: true,
  selectedFont: 'jetbrains',
  fontSize: 13,
};

const initialWatermark: WatermarkState = {
  enabled: false,
  text: 'CodeFrame',
  opacity: 50,
};

const initialCanvas: CanvasState = {
  scale: 1,
  offset: { x: 0, y: 0 },
};

// ---------------------------------------------------------------------------
// Store 实现
// ---------------------------------------------------------------------------

export const useCodegenStore = create<CodegenState>((set, get) => ({
  // 状态
  theme: initialTheme,
  window: initialWindow,
  editor: initialEditor,
  watermark: initialWatermark,
  canvas: initialCanvas,
  isEditing: false,
  winSize: { width: 520, height: 400 },
  manualResized: false,

  // Actions
  setTheme: (theme) =>
    set((state) => ({
      theme: { ...state.theme, ...theme },
    })),

  setWindow: (window) =>
    set((state) => ({
      window: { ...state.window, ...window },
    })),

  setEditor: (editor) =>
    set((state) => ({
      editor: { ...state.editor, ...editor },
    })),

  setWatermark: (watermark) =>
    set((state) => ({
      watermark: { ...state.watermark, ...watermark },
    })),

  setCanvas: (canvas) =>
    set((state) => ({
      canvas: { ...state.canvas, ...canvas },
    })),

  setIsEditing: (isEditing) => set({ isEditing }),
  setWinSize: (winSize) => set({ winSize }),
  setManualResized: (manualResized) => set({ manualResized }),

  // 从历史记录恢复
  restoreFromHistory: (saved) => {
    const updates: Partial<CodegenState> = {};

    if (saved.selectedTheme) {
      updates.theme = { ...get().theme, selectedTheme: saved.selectedTheme as string };
    }
    if (saved.selectedBg) {
      updates.theme = { ...get().theme, selectedBg: saved.selectedBg as string };
    }
    if (saved.selectedFont) {
      updates.editor = { ...get().editor, selectedFont: saved.selectedFont as string };
    }
    if (saved.fontSize) {
      updates.editor = { ...get().editor, fontSize: saved.fontSize as number };
    }
    if (saved.showLineNumbers !== undefined) {
      updates.editor = { ...get().editor, showLineNumbers: saved.showLineNumbers as boolean };
    }
    if (saved.padding) {
      updates.window = { ...get().window, padding: saved.padding as Padding };
    }
    if (saved.borderRadius) {
      updates.window = {
        ...get().window,
        borderRadius: saved.borderRadius as { outer: number; inner: number },
      };
    }
    if (saved.shadowEnabled !== undefined) {
      updates.window = { ...get().window, shadowEnabled: saved.shadowEnabled as boolean };
    }
    if (saved.shadowIntensity !== undefined) {
      updates.window = { ...get().window, shadowIntensity: saved.shadowIntensity as number };
    }
    if (saved.showHeader !== undefined) {
      updates.window = { ...get().window, showHeader: saved.showHeader as boolean };
    }
    if (saved.fileName) {
      updates.window = { ...get().window, fileName: saved.fileName as string };
    }
    if (saved.watermarkEnabled !== undefined) {
      updates.watermark = { ...get().watermark, enabled: saved.watermarkEnabled as boolean };
    }
    if (saved.watermarkText) {
      updates.watermark = { ...get().watermark, text: saved.watermarkText as string };
    }
    if (saved.watermarkOpacity !== undefined) {
      updates.watermark = { ...get().watermark, opacity: saved.watermarkOpacity as number };
    }

    set(updates);
  },

  // 获取用于保存的历史状态
  getHistoryState: () => {
    const state = get();
    return {
      selectedTheme: state.theme.selectedTheme,
      selectedBg: state.theme.selectedBg,
      selectedFont: state.editor.selectedFont,
      fontSize: state.editor.fontSize,
      showLineNumbers: state.editor.showLineNumbers,
      padding: state.window.padding,
      borderRadius: state.window.borderRadius,
      shadowEnabled: state.window.shadowEnabled,
      shadowIntensity: state.window.shadowIntensity,
      showHeader: state.window.showHeader,
      fileName: state.window.fileName,
      watermarkEnabled: state.watermark.enabled,
      watermarkText: state.watermark.text,
      watermarkOpacity: state.watermark.opacity,
    };
  },
}));

// ---------------------------------------------------------------------------
// 派生状态 Hooks
// ---------------------------------------------------------------------------

/**
 * 获取当前主题配置
 */
export function useCurrentTheme() {
  const selectedTheme = useCodegenStore((s) => s.theme.selectedTheme);
  const { THEMES } = require('../config/themes');
  return THEMES.find((t: { id: string }) => t.id === selectedTheme) ?? THEMES[0];
}

/**
 * 获取当前背景配置
 */
export function useCurrentBackground() {
  const selectedBg = useCodegenStore((s) => s.theme.selectedBg);
  const { BACKGROUNDS } = require('../config/backgrounds');
  return BACKGROUNDS.find((b: { id: string }) => b.id === selectedBg);
}

/**
 * 获取当前字体配置
 */
export function useCurrentFont() {
  const selectedFont = useCodegenStore((s) => s.editor.selectedFont);
  return FONT_OPTIONS.find((f) => f.id === selectedFont) ?? FONT_OPTIONS[0];
}
