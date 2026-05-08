/**
 * Editor Zustand Store
 * 统一管理 Editor 模块的所有状态
 */

import { create } from 'zustand';
import type {
  ArrowShape,
  RectShape,
  TextShape,
  MosaicShape,
  CropArea,
  ToolId,
  ShapeType,
  ImageFrameSettings,
  EditorSource,
  LastUsedStyles,
} from '../types';
import {
  DEFAULT_FRAME_SETTINGS,
  DEFAULT_ARROW_STYLE,
  DEFAULT_RECT_STYLE,
  DEFAULT_TEXT_STYLE,
  DEFAULT_MOSAIC_STYLE,
} from '../constants';

// ---------------------------------------------------------------------------
// Store 状态接口
// ---------------------------------------------------------------------------

interface EditorStore {
  // 图片状态
  source: EditorSource | null;
  imageData: string | null;
  error: string | null;
  imageNaturalSize: { width: number; height: number } | null;
  imageDisplaySize: { width: number; height: number } | null;

  // 工具状态
  activeTool: ToolId;

  // 帧设置
  frameSettings: ImageFrameSettings;
  collapsedSections: Record<string, boolean>;

  // 视图状态
  scale: number;
  offset: { x: number; y: number };

  // 导出状态
  isExporting: boolean;
  copied: boolean;

  // 图形状态 - 箭头
  arrows: ArrowShape[];
  selectedArrowIds: string[];

  // 图形状态 - 矩形
  rects: RectShape[];
  selectedRectIds: string[];

  // 图形状态 - 文字
  texts: TextShape[];
  selectedTextIds: string[];
  editingTextId: string | null;
  editingTextValue: string;

  // 图形状态 - 马赛克
  mosaics: MosaicShape[];
  selectedMosaicIds: string[];

  // 裁剪状态
  cropArea: CropArea | null;

  // 裁剪模式（独立于工具）
  isCropMode: boolean;
  previousTool: ToolId | null;

  // 属性记忆
  lastUsedStyles: LastUsedStyles;

  // 历史记录状态
  canUndo: boolean;
  canRedo: boolean;
}

// ---------------------------------------------------------------------------
// Store Actions 接口
// ---------------------------------------------------------------------------

// 支持函数式更新的类型
type SetStateAction<T> = T | ((prev: T) => T);

interface EditorActions {
  // 图片操作
  setSource: (source: SetStateAction<EditorSource | null>) => void;
  setImageData: (data: SetStateAction<string | null>) => void;
  setError: (error: SetStateAction<string | null>) => void;
  setImageNaturalSize: (size: SetStateAction<{ width: number; height: number } | null>) => void;
  setImageDisplaySize: (size: SetStateAction<{ width: number; height: number } | null>) => void;

  // 工具操作
  setActiveTool: (tool: SetStateAction<ToolId>) => void;

  // 帧设置操作
  setFrameSettings: (settings: SetStateAction<ImageFrameSettings>) => void;
  updateFrameSettings: (updates: Partial<ImageFrameSettings>) => void;
  setCollapsedSections: (sections: SetStateAction<Record<string, boolean>>) => void;

  // 视图操作
  setScale: (scale: SetStateAction<number>) => void;
  setOffset: (offset: SetStateAction<{ x: number; y: number }>) => void;

  // 导出操作
  setIsExporting: (isExporting: SetStateAction<boolean>) => void;
  setCopied: (copied: SetStateAction<boolean>) => void;

  // 箭头操作
  setArrows: (arrows: SetStateAction<ArrowShape[]>) => void;
  addArrow: (arrow: ArrowShape) => void;
  updateArrow: (id: string, updates: Partial<ArrowShape>) => void;
  deleteArrow: (id: string) => void;
  deleteArrows: (ids: string[]) => void;
  setSelectedArrowIds: (ids: SetStateAction<string[]>) => void;

  // 矩形操作
  setRects: (rects: SetStateAction<RectShape[]>) => void;
  addRect: (rect: RectShape) => void;
  updateRect: (id: string, updates: Partial<RectShape>) => void;
  deleteRect: (id: string) => void;
  deleteRects: (ids: string[]) => void;
  setSelectedRectIds: (ids: SetStateAction<string[]>) => void;

  // 文字操作
  setTexts: (texts: SetStateAction<TextShape[]>) => void;
  addText: (text: TextShape) => void;
  updateText: (id: string, updates: Partial<TextShape>) => void;
  deleteText: (id: string) => void;
  deleteTexts: (ids: string[]) => void;
  setSelectedTextIds: (ids: SetStateAction<string[]>) => void;
  setEditingTextId: (id: SetStateAction<string | null>) => void;
  setEditingTextValue: (value: SetStateAction<string>) => void;

  // 马赛克操作
  setMosaics: (mosaics: SetStateAction<MosaicShape[]>) => void;
  addMosaic: (mosaic: MosaicShape) => void;
  updateMosaic: (id: string, updates: Partial<MosaicShape>) => void;
  deleteMosaic: (id: string) => void;
  deleteMosaics: (ids: string[]) => void;
  setSelectedMosaicIds: (ids: SetStateAction<string[]>) => void;

  // 裁剪操作
  setCropArea: (area: SetStateAction<CropArea | null>) => void;
  enterCropMode: () => void;
  exitCropMode: () => void;

  // 图层操作
  moveLayerUp: (type: ShapeType, id: string) => void;
  moveLayerDown: (type: ShapeType, id: string) => void;

  // 属性记忆操作
  updateLastUsedStyles: (
    tool: 'arrow' | 'rect' | 'text' | 'mosaic',
    styles: Partial<LastUsedStyles[typeof tool]>,
  ) => void;

  // 历史记录操作
  setCanUndo: (canUndo: SetStateAction<boolean>) => void;
  setCanRedo: (canRedo: SetStateAction<boolean>) => void;

  // 批量操作
  getEditorState: () => EditorStore;
  setEditorState: (state: Partial<EditorStore>) => void;
  clearSelection: () => void;
  selectAll: () => void;
  deleteSelected: () => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// 初始状态
// ---------------------------------------------------------------------------

const initialState: EditorStore = {
  // 图片状态
  source: null,
  imageData: null,
  error: null,
  imageNaturalSize: null,
  imageDisplaySize: null,

  // 工具状态
  activeTool: 'select',

  // 帧设置
  frameSettings: DEFAULT_FRAME_SETTINGS,
  collapsedSections: {},

  // 视图状态
  scale: 1,
  offset: { x: 0, y: 0 },

  // 导出状态
  isExporting: false,
  copied: false,

  // 图形状态 - 箭头
  arrows: [],
  selectedArrowIds: [],

  // 图形状态 - 矩形
  rects: [],
  selectedRectIds: [],

  // 图形状态 - 文字
  texts: [],
  selectedTextIds: [],
  editingTextId: null,
  editingTextValue: '',

  // 图形状态 - 马赛克
  mosaics: [],
  selectedMosaicIds: [],

  // 裁剪状态
  cropArea: null,

  // 裁剪模式
  isCropMode: false,
  previousTool: null,

  // 属性记忆
  lastUsedStyles: {
    arrow: { ...DEFAULT_ARROW_STYLE },
    rect: { ...DEFAULT_RECT_STYLE },
    text: { ...DEFAULT_TEXT_STYLE },
    mosaic: { ...DEFAULT_MOSAIC_STYLE },
  },

  // 历史记录状态
  canUndo: false,
  canRedo: false,
};

// ---------------------------------------------------------------------------
// Store 创建
// ---------------------------------------------------------------------------

// 辅助函数：处理函数式更新
function resolveSetter<T>(value: SetStateAction<T>, prev: T): T {
  return typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
}

// 辅助函数：按类型获取图形数组
function getShapeArray(
  state: EditorStore,
  type: ShapeType
): (ArrowShape | RectShape | TextShape | MosaicShape)[] {
  switch (type) {
    case 'arrow': return state.arrows;
    case 'rect': return state.rects;
    case 'text': return state.texts;
    case 'mosaic': return state.mosaics;
  }
}

// 辅助函数：按类型设置图形数组
function setShapeArray(
  _state: EditorStore,
  type: ShapeType,
  shapes: (ArrowShape | RectShape | TextShape | MosaicShape)[]
): Partial<EditorStore> {
  switch (type) {
    case 'arrow': return { arrows: shapes as ArrowShape[] };
    case 'rect': return { rects: shapes as RectShape[] };
    case 'text': return { texts: shapes as TextShape[] };
    case 'mosaic': return { mosaics: shapes as MosaicShape[] };
  }
}

export const useEditorStore = create<EditorStore & EditorActions>((set, get) => ({
  ...initialState,

  // 图片操作
  setSource: (source) => set((state) => ({ source: resolveSetter(source, state.source) })),
  setImageData: (imageData) => set((state) => ({ imageData: resolveSetter(imageData, state.imageData) })),
  setError: (error) => set((state) => ({ error: resolveSetter(error, state.error) })),
  setImageNaturalSize: (imageNaturalSize) => set((state) => ({ imageNaturalSize: resolveSetter(imageNaturalSize, state.imageNaturalSize) })),
  setImageDisplaySize: (imageDisplaySize) => set((state) => ({ imageDisplaySize: resolveSetter(imageDisplaySize, state.imageDisplaySize) })),

  // 工具操作
  setActiveTool: (activeTool) =>
    set((state) => {
      const resolved = resolveSetter(activeTool, state.activeTool);
      // 切换到绘制工具时，清空选中状态，避免残留选框
      const isDrawingTool =
        resolved === 'arrow' || resolved === 'rect' || resolved === 'text' || resolved === 'mosaic';
      return {
        activeTool: resolved,
        ...(isDrawingTool
          ? { selectedArrowIds: [], selectedRectIds: [], selectedTextIds: [], selectedMosaicIds: [] }
          : {}),
      };
    }),

  // 帧设置操作
  setFrameSettings: (frameSettings) => set((state) => ({ frameSettings: resolveSetter(frameSettings, state.frameSettings) })),
  updateFrameSettings: (updates) =>
    set((state) => ({
      frameSettings: { ...state.frameSettings, ...updates },
    })),
  setCollapsedSections: (collapsedSections) => set((state) => ({ collapsedSections: resolveSetter(collapsedSections, state.collapsedSections) })),

  // 视图操作
  setScale: (scale) => set((state) => ({ scale: resolveSetter(scale, state.scale) })),
  setOffset: (offset) => set((state) => ({ offset: resolveSetter(offset, state.offset) })),

  // 导出操作
  setIsExporting: (isExporting) => set((state) => ({ isExporting: resolveSetter(isExporting, state.isExporting) })),
  setCopied: (copied) => set((state) => ({ copied: resolveSetter(copied, state.copied) })),

  // 箭头操作
  setArrows: (arrows) => set((state) => ({ arrows: resolveSetter(arrows, state.arrows) })),
  addArrow: (arrow) => set((state) => ({ arrows: [...state.arrows, arrow] })),
  updateArrow: (id, updates) =>
    set((state) => ({
      arrows: state.arrows.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),
  deleteArrow: (id) =>
    set((state) => ({
      arrows: state.arrows.filter((a) => a.id !== id),
      selectedArrowIds: state.selectedArrowIds.filter((aid) => aid !== id),
    })),
  deleteArrows: (ids) =>
    set((state) => ({
      arrows: state.arrows.filter((a) => !ids.includes(a.id)),
      selectedArrowIds: state.selectedArrowIds.filter(
        (aid) => !ids.includes(aid)
      ),
    })),
  setSelectedArrowIds: (selectedArrowIds) => set((state) => ({ selectedArrowIds: resolveSetter(selectedArrowIds, state.selectedArrowIds) })),

  // 矩形操作
  setRects: (rects) => set((state) => ({ rects: resolveSetter(rects, state.rects) })),
  addRect: (rect) => set((state) => ({ rects: [...state.rects, rect] })),
  updateRect: (id, updates) =>
    set((state) => ({
      rects: state.rects.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),
  deleteRect: (id) =>
    set((state) => ({
      rects: state.rects.filter((r) => r.id !== id),
      selectedRectIds: state.selectedRectIds.filter((rid) => rid !== id),
    })),
  deleteRects: (ids) =>
    set((state) => ({
      rects: state.rects.filter((r) => !ids.includes(r.id)),
      selectedRectIds: state.selectedRectIds.filter(
        (rid) => !ids.includes(rid)
      ),
    })),
  setSelectedRectIds: (selectedRectIds) => set((state) => ({ selectedRectIds: resolveSetter(selectedRectIds, state.selectedRectIds) })),

  // 文字操作
  setTexts: (texts) => set((state) => ({ texts: resolveSetter(texts, state.texts) })),
  addText: (text) => set((state) => ({ texts: [...state.texts, text] })),
  updateText: (id, updates) =>
    set((state) => ({
      texts: state.texts.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),
  deleteText: (id) =>
    set((state) => ({
      texts: state.texts.filter((t) => t.id !== id),
      selectedTextIds: state.selectedTextIds.filter((tid) => tid !== id),
    })),
  deleteTexts: (ids) =>
    set((state) => ({
      texts: state.texts.filter((t) => !ids.includes(t.id)),
      selectedTextIds: state.selectedTextIds.filter(
        (tid) => !ids.includes(tid)
      ),
    })),
  setSelectedTextIds: (selectedTextIds) => set((state) => ({ selectedTextIds: resolveSetter(selectedTextIds, state.selectedTextIds) })),
  setEditingTextId: (editingTextId) => set((state) => ({ editingTextId: resolveSetter(editingTextId, state.editingTextId) })),
  setEditingTextValue: (editingTextValue) => set((state) => ({ editingTextValue: resolveSetter(editingTextValue, state.editingTextValue) })),

  // 马赛克操作
  setMosaics: (mosaics) => set((state) => ({ mosaics: resolveSetter(mosaics, state.mosaics) })),
  addMosaic: (mosaic) =>
    set((state) => ({ mosaics: [...state.mosaics, mosaic] })),
  updateMosaic: (id, updates) =>
    set((state) => ({
      mosaics: state.mosaics.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
  deleteMosaic: (id) =>
    set((state) => ({
      mosaics: state.mosaics.filter((m) => m.id !== id),
      selectedMosaicIds: state.selectedMosaicIds.filter(
        (mid) => mid !== id
      ),
    })),
  deleteMosaics: (ids) =>
    set((state) => ({
      mosaics: state.mosaics.filter((m) => !ids.includes(m.id)),
      selectedMosaicIds: state.selectedMosaicIds.filter(
        (mid) => !ids.includes(mid)
      ),
    })),
  setSelectedMosaicIds: (selectedMosaicIds) => set((state) => ({ selectedMosaicIds: resolveSetter(selectedMosaicIds, state.selectedMosaicIds) })),

  // 裁剪操作
  setCropArea: (cropArea) => set((state) => ({ cropArea: resolveSetter(cropArea, state.cropArea) })),
  enterCropMode: () =>
    set((state) => ({
      isCropMode: true,
      previousTool: state.activeTool,
    })),
  exitCropMode: () =>
    set((state) => ({
      isCropMode: false,
      activeTool: state.previousTool ?? 'select',
      previousTool: null,
      cropArea: null,
    })),

  // 图层操作
  moveLayerUp: (type, id) =>
    set((state) => {
      const shapes = getShapeArray(state, type);
      const idx = shapes.findIndex((s) => s.id === id);
      if (idx < 0 || idx >= shapes.length - 1) return state;
      const nextIdx = idx + 1;
      const zA = shapes[idx].zIndex;
      const zB = shapes[nextIdx].zIndex;
      const updated = shapes.map((s, i) => {
        if (i === idx) return { ...s, zIndex: zB };
        if (i === nextIdx) return { ...s, zIndex: zA };
        return s;
      });
      return setShapeArray(state, type, updated);
    }),
  moveLayerDown: (type, id) =>
    set((state) => {
      const shapes = getShapeArray(state, type);
      const idx = shapes.findIndex((s) => s.id === id);
      if (idx <= 0) return state;
      const prevIdx = idx - 1;
      const zA = shapes[idx].zIndex;
      const zB = shapes[prevIdx].zIndex;
      const updated = shapes.map((s, i) => {
        if (i === idx) return { ...s, zIndex: zB };
        if (i === prevIdx) return { ...s, zIndex: zA };
        return s;
      });
      return setShapeArray(state, type, updated);
    }),

  // 属性记忆操作
  updateLastUsedStyles: (tool, styles) =>
    set((state) => ({
      lastUsedStyles: {
        ...state.lastUsedStyles,
        [tool]: {
          ...state.lastUsedStyles[tool],
          ...styles,
        },
      },
    })),

  // 历史记录操作
  setCanUndo: (canUndo) => set((state) => ({ canUndo: resolveSetter(canUndo, state.canUndo) })),
  setCanRedo: (canRedo) => set((state) => ({ canRedo: resolveSetter(canRedo, state.canRedo) })),

  // 批量操作
  getEditorState: () => get(),
  setEditorState: (newState) => set(newState),
  clearSelection: () =>
    set({
      selectedArrowIds: [],
      selectedRectIds: [],
      selectedTextIds: [],
      selectedMosaicIds: [],
    }),
  selectAll: () =>
    set((state) => ({
      selectedArrowIds: state.arrows.map((a) => a.id),
      selectedRectIds: state.rects.map((r) => r.id),
      selectedTextIds: state.texts.map((t) => t.id),
      selectedMosaicIds: state.mosaics.map((m) => m.id),
    })),
  deleteSelected: () =>
    set((state) => ({
      arrows: state.arrows.filter(
        (a) => !state.selectedArrowIds.includes(a.id)
      ),
      rects: state.rects.filter(
        (r) => !state.selectedRectIds.includes(r.id)
      ),
      texts: state.texts.filter(
        (t) => !state.selectedTextIds.includes(t.id)
      ),
      mosaics: state.mosaics.filter(
        (m) => !state.selectedMosaicIds.includes(m.id)
      ),
      selectedArrowIds: [],
      selectedRectIds: [],
      selectedTextIds: [],
      selectedMosaicIds: [],
    })),
  reset: () => set(initialState),
}));

export type { EditorStore, EditorActions };
