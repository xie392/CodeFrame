/**
 * Editor 统一状态类型定义
 */

// 箭头样式类型
export type ArrowStyle = 'single' | 'double';

// 矩形边框样式类型
export type RectBorderStyle = 'solid' | 'dashed';

// 工具 ID 类型
export type ToolId = 'select' | 'move' | 'arrow' | 'rect' | 'text' | 'mosaic' | 'crop';

// 箭头数据结构
export interface ArrowShape {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  strokeWidth: number;
  headSize: number;
  style: ArrowStyle;
}

// 矩形数据结构
export interface RectShape {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
  fillOpacity: number; // 0-100
  borderStyle: RectBorderStyle;
}

// 文字数据结构
export interface TextShape {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
}

// 马赛克数据结构
export interface MosaicShape {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  blockSize: number;
  opacity: number; // 0-100
}

// 裁剪区域数据结构
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 视图状态
export interface ViewState {
  scale: number;
  offset: { x: number; y: number };
}

// Editor 统一状态
export interface EditorState {
  // 标注数据
  arrows: ArrowShape[];
  rects: RectShape[];
  texts: TextShape[];
  mosaics: MosaicShape[];

  // 图片数据
  imageData: string | null;

  // 视图状态
  view: ViewState;

  // 选中状态（支持多选）
  selectedArrowIds: string[];
  selectedRectIds: string[];
  selectedTextIds: string[];
  selectedMosaicIds: string[];
}

// 历史记录状态
export interface HistoryState {
  past: EditorState[];
  present: EditorState;
  future: EditorState[];
}

// 历史记录操作
export interface HistoryActions {
  // 推送新状态到历史记录
  pushState: (state: EditorState) => void;
  // 撤销
  undo: () => EditorState | null;
  // 重做
  redo: () => EditorState | null;
  // 是否可撤销
  canUndo: () => boolean;
  // 是否可重做
  canRedo: () => boolean;
  // 清空历史
  clearHistory: () => void;
  // 重置到新状态（清除所有历史）
  resetToState: (state: EditorState) => void;
}
