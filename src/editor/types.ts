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

// 圆角单位类型
export type BorderRadiusUnit = 'px' | '%';

// 圆角预设
export interface BorderRadiusPreset {
  name: string;
  value: number;
  unit: 'px';
}

// 圆角预设常量
export const BORDER_RADIUS_PRESETS: BorderRadiusPreset[] = [
  { name: '无圆角', value: 0, unit: 'px' },
  { name: '小圆角', value: 8, unit: 'px' },
  { name: '中等圆角', value: 16, unit: 'px' },
  { name: '大圆角', value: 24, unit: 'px' },
  { name: '胶囊形', value: 9999, unit: 'px' },
];

// 图片容器设置
export interface ImageFrameSettings {
  // 背景
  background: {
    type: 'solid' | 'linear' | 'radial';
    color: string;
    gradientColors: [string, string];
    gradientAngle: number;
  };
  // 边距
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    linked: boolean;
  };
  // 圆角（容器）
  borderRadius: {
    unit: BorderRadiusUnit;
    topLeft: number;
    topRight: number;
    bottomRight: number;
    bottomLeft: number;
    linked: boolean;
  };
  // 图片圆角
  imageRadius: {
    unit: BorderRadiusUnit;
    topLeft: number;
    topRight: number;
    bottomRight: number;
    bottomLeft: number;
    linked: boolean;
  };
  // 阴影（容器）
  shadow: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  // 图片阴影
  imageShadow: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  // 比例
  aspectRatio: string;
  // 自定义比例（当 aspectRatio 为 'custom' 时使用）
  customAspectRatio: { width: number; height: number };
  // 窗口控件
  windowControl: {
    enabled: boolean;
    style: 'macos' | 'windows';
  };
  // 水印
  watermark: {
    enabled: boolean;
    text: string;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    opacity: number;
    fontSize: number;
    // 图片水印
    imageUrl: string | null;
    imageSize: number; // 图片水印大小，32-200px
  };
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
