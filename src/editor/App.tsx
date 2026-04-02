import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type DragEvent,
  type ClipboardEvent,
} from 'react';
import {
  MousePointer2,
  Move,
  MoveRight,
  Square,
  Type,
  Scan,
  Crop,
  Undo2,
  Redo2,
  ImagePlus,
  Download,
  ClipboardCopy,
  Minus,
  Plus,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';
import { STORAGE_KEYS } from '@shared/constants';
import { useEditorHistory } from './hooks/useEditorHistory';
import type {
  EditorState,
  ArrowShape,
  RectShape,
  TextShape,
  MosaicShape,
  CropArea,
  ToolId,
  ArrowStyle,
  RectBorderStyle,
  ImageFrameSettings,
} from './types';

// ---------------------------------------------------------------------------
// 常量与类型
// ---------------------------------------------------------------------------

const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
] as const;

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;
const MAX_IMG_W = 800;
const MAX_IMG_H = 600;

// 预设颜色
const PRESET_COLORS = [
  '#EF4444', // 红
  '#F59E0B', // 橙
  '#EAB308', // 黄
  '#22C55E', // 绿
  '#3B82F6', // 蓝
  '#8B5CF6', // 紫
  '#FFFFFF', // 白
  '#000000', // 黑
] as const;

// 默认箭头样式
const DEFAULT_ARROW_STYLE: {
  color: string;
  strokeWidth: number;
  headSize: number;
  style: ArrowStyle;
} = {
  color: '#EF4444',
  strokeWidth: 2,
  headSize: 12,
  style: 'single',
};

// 默认矩形样式
const DEFAULT_RECT_STYLE: {
  color: string;
  strokeWidth: number;
  fillOpacity: number;
  borderStyle: RectBorderStyle;
} = {
  color: '#EF4444',
  strokeWidth: 2,
  fillOpacity: 0,
  borderStyle: 'solid',
};

// 默认文字样式
const DEFAULT_TEXT_STYLE: {
  color: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
} = {
  color: '#EF4444',
  fontSize: 24,
  fontWeight: 'normal',
  fontStyle: 'normal',
};

// 默认马赛克样式
const DEFAULT_MOSAIC_STYLE: {
  blockSize: number;
  opacity: number;
} = {
  blockSize: 10,
  opacity: 100,
};

// 默认图片容器设置
const DEFAULT_FRAME_SETTINGS: ImageFrameSettings = {
  background: {
    type: 'solid',
    color: 'transparent',
    gradientColors: ['#FFFFFF', '#000000'],
    gradientAngle: 135,
  },
  padding: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    linked: true,
  },
  borderRadius: {
    value: 0,
    linked: true,
  },
  shadow: {
    enabled: false,
    color: '#000000',
    blur: 20,
    offsetX: 0,
    offsetY: 10,
  },
  aspectRatio: 'original',
  windowControl: {
    enabled: false,
    style: 'macos',
  },
  watermark: {
    enabled: false,
    text: '',
    position: 'bottom-right',
    opacity: 50,
    fontSize: 14,
  },
};

// 背景预设
const BACKGROUND_PRESETS = [
  { name: '透明', type: 'solid' as const, color: 'transparent' },
  { name: '白色', type: 'solid' as const, color: '#FFFFFF' },
  { name: '黑色', type: 'solid' as const, color: '#000000' },
  {
    name: '日落',
    type: 'linear' as const,
    gradientColors: ['#FF512F', '#DD2476'] as [string, string],
    gradientAngle: 135,
  },
  {
    name: '海洋',
    type: 'linear' as const,
    gradientColors: ['#2193b0', '#6dd5ed'] as [string, string],
    gradientAngle: 135,
  },
  {
    name: '森林',
    type: 'linear' as const,
    gradientColors: ['#134E5E', '#71B280'] as [string, string],
    gradientAngle: 135,
  },
  {
    name: '紫色',
    type: 'linear' as const,
    gradientColors: ['#667eea', '#764ba2'] as [string, string],
    gradientAngle: 135,
  },
  {
    name: '蜜桃',
    type: 'linear' as const,
    gradientColors: ['#FFB88C', '#DE6262'] as [string, string],
    gradientAngle: 135,
  },
];

// 阴影预设
const SHADOW_PRESETS = [
  { name: '无', enabled: false, blur: 0, offsetX: 0, offsetY: 0 },
  { name: '轻微', enabled: true, blur: 10, offsetX: 0, offsetY: 4 },
  { name: '中等', enabled: true, blur: 20, offsetX: 0, offsetY: 10 },
  { name: '强烈', enabled: true, blur: 40, offsetX: 0, offsetY: 20 },
];

// 比例预设
const ASPECT_RATIO_PRESETS = [
  { name: '原始', value: 'original' },
  { name: '1:1', value: '1:1' },
  { name: '4:3', value: '4:3' },
  { name: '16:9', value: '16:9' },
  { name: '16:10', value: '16:10' },
  { name: 'iPhone', value: '9:19.5' },
  { name: 'iPad', value: '3:4' },
];

type EditorSource = 'capture' | 'upload';

interface ToolConfig {
  id: ToolId;
  icon: React.ReactNode;
}

const TOOLS: ToolConfig[] = [
  { id: 'select', icon: <MousePointer2 size={18} /> },
  { id: 'move', icon: <Move size={18} /> },
  { id: 'arrow', icon: <MoveRight size={18} /> },
  { id: 'rect', icon: <Square size={18} /> },
  { id: 'text', icon: <Type size={18} /> },
  { id: 'mosaic', icon: <Scan size={18} /> },
  { id: 'crop', icon: <Crop size={18} /> },
];

// ---------------------------------------------------------------------------
// 工具函数
// ---------------------------------------------------------------------------

function parseSource(): EditorSource | null {
  const params = new URLSearchParams(window.location.search);
  const source = params.get('source');
  if (source === 'capture' || source === 'upload') return source;
  return 'upload'; // 默认空画布模式
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isAcceptedImageType(file: File): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type);
}

// 箭头 ID 计数器
let arrowIdCounter = 0;

function generateId(): string {
  return `arrow_${Date.now()}_${++arrowIdCounter}`;
}

// 矩形 ID 计数器
let rectIdCounter = 0;

function generateRectId(): string {
  return `rect_${Date.now()}_${++rectIdCounter}`;
}

// 文字 ID 计数器
let textIdCounter = 0;

function generateTextId(): string {
  return `text_${Date.now()}_${++textIdCounter}`;
}

// 马赛克 ID 计数器
let mosaicIdCounter = 0;

function generateMosaicId(): string {
  return `mosaic_${Date.now()}_${++mosaicIdCounter}`;
}

// 控制点半径
const HANDLE_RADIUS = 6;

// 箭头拖拽类型（起点、终点、中点、移动）
type DragType = 'none' | 'move' | 'start' | 'end' | 'middle';

// 矩形拖拽类型（8个控制点 + 移动）
type RectDragType =
  | 'none'
  | 'move'
  | 'resize-tl'
  | 'resize-tr'
  | 'resize-bl'
  | 'resize-br'
  | 'resize-t'
  | 'resize-r'
  | 'resize-b'
  | 'resize-l';

// 矩形控制点光标映射
const RECT_CURSOR_MAP: Record<RectDragType, string> = {
  none: 'default',
  move: 'move',
  'resize-tl': 'nwse-resize',
  'resize-tr': 'nesw-resize',
  'resize-bl': 'nesw-resize',
  'resize-br': 'nwse-resize',
  'resize-t': 'ns-resize',
  'resize-b': 'ns-resize',
  'resize-l': 'ew-resize',
  'resize-r': 'ew-resize',
};

// 文字拖拽类型（四角调整字号）
type TextDragType = 'none' | 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br';

// 文字控制点光标映射
const TEXT_CURSOR_MAP: Record<TextDragType, string> = {
  none: 'default',
  move: 'move',
  'resize-tl': 'nwse-resize',
  'resize-tr': 'nesw-resize',
  'resize-bl': 'nesw-resize',
  'resize-br': 'nwse-resize',
};

// 马赛克拖拽类型（8个控制点 + 移动，与矩形相同）
type MosaicDragType = RectDragType;

// 马赛克控制点光标映射（与矩形相同）
const MOSAIC_CURSOR_MAP: Record<MosaicDragType, string> = RECT_CURSOR_MAP;

// 最小裁剪尺寸
const MIN_CROP_SIZE = 10;

// 裁剪框拖拽类型（与矩形相同）
type CropDragType = RectDragType;

// 裁剪框光标映射（与矩形相同）
const CROP_CURSOR_MAP: Record<CropDragType, string> = RECT_CURSOR_MAP;

// 在 Canvas 上绘制箭头
function drawArrow(
  ctx: CanvasRenderingContext2D,
  arrow: ArrowShape,
  isSelected: boolean = false,
): void {
  const { startX, startY, endX, endY, color, strokeWidth, headSize, style } =
    arrow;

  // 计算方向向量
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 1) return;

  const unitX = dx / length;
  const unitY = dy / length;

  // 箭头头部角度（30度）
  const angle = Math.PI / 6;

  ctx.save();

  // 先绘制选中状态高亮（在箭头下方）
  if (isSelected) {
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.lineWidth = strokeWidth + 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  // 设置箭头样式
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 绘制主线
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // 绘制箭头头部
  const drawHead = (tipX: number, tipY: number, dirX: number, dirY: number) => {
    const headLen = headSize;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - headLen * (dirX * Math.cos(angle) - dirY * Math.sin(angle)),
      tipY - headLen * (dirY * Math.cos(angle) + dirX * Math.sin(angle)),
    );
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - headLen * (dirX * Math.cos(angle) + dirY * Math.sin(angle)),
      tipY - headLen * (dirY * Math.cos(angle) - dirX * Math.sin(angle)),
    );
    ctx.stroke();
  };

  // 终点箭头
  drawHead(endX, endY, unitX, unitY);

  // 起点（双箭头）
  if (style === 'double') {
    drawHead(startX, startY, -unitX, -unitY);
  }

  // 绘制选中状态的控制点
  if (isSelected) {
    ctx.fillStyle = '#3B82F6';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    // 起点控制点
    ctx.beginPath();
    ctx.arc(startX, startY, HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 中点控制点（箭头长度足够时才显示）
    const arrowLength = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
    const minArrowLengthForMidHandle = HANDLE_RADIUS * 4;
    if (arrowLength >= minArrowLengthForMidHandle) {
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      ctx.beginPath();
      ctx.arc(midX, midY, HANDLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 终点控制点
    ctx.beginPath();
    ctx.arc(endX, endY, HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

// 检测点击是否在箭头附近
function isPointNearArrow(
  x: number,
  y: number,
  arrow: ArrowShape,
  threshold: number = 8,
): boolean {
  const { startX, startY, endX, endY } = arrow;

  // 计算点到线段的距离
  const dx = endX - startX;
  const dy = endY - startY;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    // 线段退化为点
    const dist = Math.sqrt((x - startX) ** 2 + (y - startY) ** 2);
    return dist <= threshold;
  }

  // 计算投影参数 t
  let t = ((x - startX) * dx + (y - startY) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  // 最近点
  const nearestX = startX + t * dx;
  const nearestY = startY + t * dy;

  const dist = Math.sqrt((x - nearestX) ** 2 + (y - nearestY) ** 2);
  return dist <= threshold;
}

// 检测点击是否在控制点上，返回拖拽类型
function getDragTypeAtPoint(
  x: number,
  y: number,
  arrow: ArrowShape,
): DragType {
  const { startX, startY, endX, endY } = arrow;
  const threshold = HANDLE_RADIUS + 2;

  // 计算中点
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  // 检测终点控制点
  const distEnd = Math.sqrt((x - endX) ** 2 + (y - endY) ** 2);
  if (distEnd <= threshold) return 'end';

  // 检测起点控制点
  const distStart = Math.sqrt((x - startX) ** 2 + (y - startY) ** 2);
  if (distStart <= threshold) return 'start';

  // 检测中点控制点（箭头长度足够时才显示）
  const arrowLength = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
  const minArrowLengthForMidHandle = HANDLE_RADIUS * 4; // 最小长度为控制点半径的 4 倍
  if (arrowLength >= minArrowLengthForMidHandle) {
    const distMid = Math.sqrt((x - midX) ** 2 + (y - midY) ** 2);
    if (distMid <= threshold) return 'middle';
  }

  // 检测箭头主体
  if (isPointNearArrow(x, y, arrow)) return 'move';

  return 'none';
}

// 在 Canvas 上绘制矩形
function drawRect(
  ctx: CanvasRenderingContext2D,
  rect: RectShape,
  isSelected: boolean = false,
): void {
  const { x, y, width, height, color, strokeWidth, fillOpacity, borderStyle } =
    rect;

  ctx.save();

  // 先绘制选中状态高亮（在矩形下方）
  if (isSelected) {
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.lineWidth = strokeWidth + 4;
    ctx.strokeRect(x, y, width, height);
  }

  // 绘制填充
  if (fillOpacity > 0) {
    const alpha = fillOpacity / 100;
    ctx.fillStyle = hexToRgba(color, alpha);
    ctx.fillRect(x, y, width, height);
  }

  // 设置边框样式
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  if (borderStyle === 'dashed') {
    ctx.setLineDash([8, 4]);
  } else {
    ctx.setLineDash([]);
  }

  // 绘制边框
  ctx.strokeRect(x, y, width, height);

  // 绘制选中状态的控制点
  if (isSelected) {
    ctx.setLineDash([]);
    ctx.fillStyle = '#3B82F6';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    const handles = getRectHandles(rect);
    handles.forEach((handle) => {
      ctx.beginPath();
      ctx.arc(handle.x, handle.y, HANDLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }

  ctx.restore();
}

// 十六进制颜色转 RGBA
function hexToRgba(hex: string, alpha: number): string {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    console.warn(`Invalid hex color: ${hex}`);
    return `rgba(0, 0, 0, ${alpha})`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 获取矩形的 8 个控制点位置
function getRectHandles(rect: RectShape): { x: number; y: number }[] {
  const { x, y, width, height } = rect;
  const cx = x + width / 2;
  const cy = y + height / 2;

  return [
    { x: x, y: y }, // 左上 (tl)
    { x: cx, y: y }, // 上中 (t)
    { x: x + width, y: y }, // 右上 (tr)
    { x: x + width, y: cy }, // 右中 (r)
    { x: x + width, y: y + height }, // 右下 (br)
    { x: cx, y: y + height }, // 下中 (b)
    { x: x, y: y + height }, // 左下 (bl)
    { x: x, y: cy }, // 左中 (l)
  ];
}

// 检测点击是否在矩形内部
function isPointInRect(x: number, y: number, rect: RectShape): boolean {
  const { x: rx, y: ry, width, height } = rect;
  return x >= rx && x <= rx + width && y >= ry && y <= ry + height;
}

// 检测点击是否在矩形边框附近
function isPointNearRectBorder(
  x: number,
  y: number,
  rect: RectShape,
  threshold: number = 8,
): boolean {
  const { x: rx, y: ry, width, height } = rect;

  // 检测是否在矩形边界附近
  const inHorizontalBand =
    y >= ry - threshold && y <= ry + height + threshold;
  const inVerticalBand =
    x >= rx - threshold && x <= rx + width + threshold;

  // 左边或右边
  if (inHorizontalBand) {
    if (Math.abs(x - rx) <= threshold || Math.abs(x - (rx + width)) <= threshold) {
      return true;
    }
  }

  // 上边或下边
  if (inVerticalBand) {
    if (Math.abs(y - ry) <= threshold || Math.abs(y - (ry + height)) <= threshold) {
      return true;
    }
  }

  return false;
}

// 检测点击位置返回矩形拖拽类型
function getRectDragTypeAtPoint(
  x: number,
  y: number,
  rect: RectShape,
): RectDragType {
  const threshold = HANDLE_RADIUS + 2;
  const handles = getRectHandles(rect);
  const handleTypes: RectDragType[] = [
    'resize-tl',
    'resize-t',
    'resize-tr',
    'resize-r',
    'resize-br',
    'resize-b',
    'resize-bl',
    'resize-l',
  ];

  // 检测控制点
  for (let i = 0; i < handles.length; i++) {
    const handle = handles[i];
    const dist = Math.sqrt((x - handle.x) ** 2 + (y - handle.y) ** 2);
    if (dist <= threshold) {
      return handleTypes[i];
    }
  }

  // 检测边框
  if (isPointNearRectBorder(x, y, rect)) {
    // 根据位置判断是哪个边
    const { x: rx, y: ry, width, height } = rect;
    const relX = (x - rx) / width;
    const relY = (y - ry) / height;

    // 角落区域
    if (relX < 0.2 && relY < 0.2) return 'resize-tl';
    if (relX > 0.8 && relY < 0.2) return 'resize-tr';
    if (relX < 0.2 && relY > 0.8) return 'resize-bl';
    if (relX > 0.8 && relY > 0.8) return 'resize-br';
    // 边缘区域
    if (relY < 0.2) return 'resize-t';
    if (relY > 0.8) return 'resize-b';
    if (relX < 0.2) return 'resize-l';
    if (relX > 0.8) return 'resize-r';
  }

  // 检测内部
  if (isPointInRect(x, y, rect)) {
    return 'move';
  }

  return 'none';
}

// ---------------------------------------------------------------------------
// 文字相关函数
// ---------------------------------------------------------------------------

// 获取文字边界
function getTextBounds(
  text: TextShape,
  ctx: CanvasRenderingContext2D,
): { x: number; y: number; width: number; height: number } {
  ctx.save();
  ctx.font = `${text.fontStyle === 'italic' ? 'italic ' : ''}${text.fontWeight === 'bold' ? 'bold ' : ''}${text.fontSize}px sans-serif`;
  const metrics = ctx.measureText(text.text);
  const width = metrics.width;
  const height = text.fontSize * 1.2; // 行高约为字号的 1.2 倍
  ctx.restore();

  return {
    x: text.x,
    y: text.y,
    width,
    height,
  };
}

// 获取文字的四个角控制点
function getTextHandles(
  text: TextShape,
  ctx: CanvasRenderingContext2D,
): { x: number; y: number; type: TextDragType }[] {
  const bounds = getTextBounds(text, ctx);
  const { x, y, width, height } = bounds;

  return [
    { x: x, y: y, type: 'resize-tl' }, // 左上
    { x: x + width, y: y, type: 'resize-tr' }, // 右上
    { x: x, y: y + height, type: 'resize-bl' }, // 左下
    { x: x + width, y: y + height, type: 'resize-br' }, // 右下
  ];
}

// 检测点击是否在文字区域内
function isPointInText(
  x: number,
  y: number,
  text: TextShape,
  ctx: CanvasRenderingContext2D,
): boolean {
  const bounds = getTextBounds(text, ctx);
  return (
    x >= bounds.x &&
    x <= bounds.x + bounds.width &&
    y >= bounds.y &&
    y <= bounds.y + bounds.height
  );
}

// 检测点击位置返回文字拖拽类型
function getTextDragTypeAtPoint(
  x: number,
  y: number,
  text: TextShape,
  ctx: CanvasRenderingContext2D,
): TextDragType {
  const threshold = HANDLE_RADIUS + 2;
  const handles = getTextHandles(text, ctx);

  // 检测控制点
  for (const handle of handles) {
    const dist = Math.sqrt((x - handle.x) ** 2 + (y - handle.y) ** 2);
    if (dist <= threshold) {
      return handle.type;
    }
  }

  // 检测文字内部
  if (isPointInText(x, y, text, ctx)) {
    return 'move';
  }

  return 'none';
}

// 在 Canvas 上绘制文字
function drawText(
  ctx: CanvasRenderingContext2D,
  text: TextShape,
  isSelected: boolean = false,
): void {
  ctx.save();

  const bounds = getTextBounds(text, ctx);

  // 先绘制选中状态高亮（在文字下方）
  if (isSelected) {
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.fillRect(bounds.x - 4, bounds.y - 2, bounds.width + 8, bounds.height + 4);
  }

  // 设置文字样式
  ctx.font = `${text.fontStyle === 'italic' ? 'italic ' : ''}${text.fontWeight === 'bold' ? 'bold ' : ''}${text.fontSize}px sans-serif`;
  ctx.fillStyle = text.color;
  ctx.textBaseline = 'top';

  // 绘制文字
  ctx.fillText(text.text, text.x, text.y);

  // 绘制选中状态的控制点
  if (isSelected) {
    ctx.fillStyle = '#3B82F6';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    const handles = getTextHandles(text, ctx);
    handles.forEach((handle) => {
      ctx.beginPath();
      ctx.arc(handle.x, handle.y, HANDLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// 马赛克相关函数
// ---------------------------------------------------------------------------

// 在 Canvas 上绘制马赛克
function drawMosaic(
  ctx: CanvasRenderingContext2D,
  mosaic: MosaicShape,
  isSelected: boolean = false,
): void {
  const { x, y, width, height, blockSize, opacity } = mosaic;

  ctx.save();

  // 先绘制选中状态高亮（在马赛克下方）
  if (isSelected) {
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, width, height);
  }

  // 设置透明度
  ctx.globalAlpha = opacity / 100;

  // 创建马赛克效果
  const clampedBlockSize = Math.max(1, blockSize);
  for (let bx = x; bx < x + width; bx += clampedBlockSize) {
    for (let by = y; by < y + height; by += clampedBlockSize) {
      // 计算当前块的实际尺寸（边缘可能不足一个完整块）
      const bw = Math.min(clampedBlockSize, x + width - bx);
      const bh = Math.min(clampedBlockSize, y + height - by);

      // 生成随机灰度颜色
      const gray = Math.floor(Math.random() * 256);
      ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
      ctx.fillRect(bx, by, bw, bh);
    }
  }

  // 绘制选中状态的控制点（不受透明度影响）
  if (isSelected) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#3B82F6';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    const handles = getMosaicHandles(mosaic);
    handles.forEach((handle) => {
      ctx.beginPath();
      ctx.arc(handle.x, handle.y, HANDLE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }

  ctx.restore();
}

// 获取马赛克的 8 个控制点位置
function getMosaicHandles(mosaic: MosaicShape): { x: number; y: number }[] {
  const { x, y, width, height } = mosaic;
  const cx = x + width / 2;
  const cy = y + height / 2;

  return [
    { x: x, y: y }, // 左上 (tl)
    { x: cx, y: y }, // 上中 (t)
    { x: x + width, y: y }, // 右上 (tr)
    { x: x + width, y: cy }, // 右中 (r)
    { x: x + width, y: y + height }, // 右下 (br)
    { x: cx, y: y + height }, // 下中 (b)
    { x: x, y: y + height }, // 左下 (bl)
    { x: x, y: cy }, // 左中 (l)
  ];
}

// 检测点击是否在马赛克内部
function isPointInMosaic(x: number, y: number, mosaic: MosaicShape): boolean {
  const { x: mx, y: my, width, height } = mosaic;
  return x >= mx && x <= mx + width && y >= my && y <= my + height;
}

// ---------------------------------------------------------------------------
// 框选相关函数
// ---------------------------------------------------------------------------

// 检测对象是否完全在框选区域内
function isArrowInRect(arrow: ArrowShape, rect: { x1: number; y1: number; x2: number; y2: number }): boolean {
  const minX = Math.min(rect.x1, rect.x2);
  const maxX = Math.max(rect.x1, rect.x2);
  const minY = Math.min(rect.y1, rect.y2);
  const maxY = Math.max(rect.y1, rect.y2);
  // 箭头的两个端点都必须在矩形内
  return (
    arrow.startX >= minX && arrow.startX <= maxX &&
    arrow.startY >= minY && arrow.startY <= maxY &&
    arrow.endX >= minX && arrow.endX <= maxX &&
    arrow.endY >= minY && arrow.endY <= maxY
  );
}

function isRectInRect(rect: RectShape, selectRect: { x1: number; y1: number; x2: number; y2: number }): boolean {
  const minX = Math.min(selectRect.x1, selectRect.x2);
  const maxX = Math.max(selectRect.x1, selectRect.x2);
  const minY = Math.min(selectRect.y1, selectRect.y2);
  const maxY = Math.max(selectRect.y1, selectRect.y2);
  // 矩形的四个角都必须在选区内
  return (
    rect.x >= minX && rect.x + rect.width <= maxX &&
    rect.y >= minY && rect.y + rect.height <= maxY
  );
}

function isTextInRect(text: TextShape, rect: { x1: number; y1: number; x2: number; y2: number }, ctx: CanvasRenderingContext2D): boolean {
  const minX = Math.min(rect.x1, rect.x2);
  const maxX = Math.max(rect.x1, rect.x2);
  const minY = Math.min(rect.y1, rect.y2);
  const maxY = Math.max(rect.y1, rect.y2);
  const bounds = getTextBounds(text, ctx);
  return (
    bounds.x >= minX && bounds.x + bounds.width <= maxX &&
    bounds.y >= minY && bounds.y + bounds.height <= maxY
  );
}

function isMosaicInRect(mosaic: MosaicShape, rect: { x1: number; y1: number; x2: number; y2: number }): boolean {
  const minX = Math.min(rect.x1, rect.x2);
  const maxX = Math.max(rect.x1, rect.x2);
  const minY = Math.min(rect.y1, rect.y2);
  const maxY = Math.max(rect.y1, rect.y2);
  return (
    mosaic.x >= minX && mosaic.x + mosaic.width <= maxX &&
    mosaic.y >= minY && mosaic.y + mosaic.height <= maxY
  );
}

// 绘制框选矩形
function drawMarqueeRect(ctx: CanvasRenderingContext2D, rect: { x1: number; y1: number; x2: number; y2: number }): void {
  const x = Math.min(rect.x1, rect.x2);
  const y = Math.min(rect.y1, rect.y2);
  const width = Math.abs(rect.x2 - rect.x1);
  const height = Math.abs(rect.y2 - rect.y1);

  ctx.save();
  // 半透明蓝色填充
  ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
  ctx.fillRect(x, y, width, height);
  // 蓝色边框
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
}

// 检测点击位置返回马赛克拖拽类型
function getMosaicDragTypeAtPoint(
  x: number,
  y: number,
  mosaic: MosaicShape,
): MosaicDragType {
  const threshold = HANDLE_RADIUS + 2;
  const handles = getMosaicHandles(mosaic);
  const handleTypes: MosaicDragType[] = [
    'resize-tl',
    'resize-t',
    'resize-tr',
    'resize-r',
    'resize-br',
    'resize-b',
    'resize-bl',
    'resize-l',
  ];

  // 检测控制点
  for (let i = 0; i < handles.length; i++) {
    const handle = handles[i];
    const dist = Math.sqrt((x - handle.x) ** 2 + (y - handle.y) ** 2);
    if (dist <= threshold) {
      return handleTypes[i];
    }
  }

  // 检测内部
  if (isPointInMosaic(x, y, mosaic)) {
    return 'move';
  }

  return 'none';
}

// ---------------------------------------------------------------------------
// 裁剪相关函数
// ---------------------------------------------------------------------------

// 获取裁剪框的 8 个控制点位置
function getCropHandles(crop: CropArea): { x: number; y: number }[] {
  const { x, y, width, height } = crop;
  const cx = x + width / 2;
  const cy = y + height / 2;

  return [
    { x: x, y: y }, // 左上 (tl)
    { x: cx, y: y }, // 上中 (t)
    { x: x + width, y: y }, // 右上 (tr)
    { x: x + width, y: cy }, // 右中 (r)
    { x: x + width, y: y + height }, // 右下 (br)
    { x: cx, y: y + height }, // 下中 (b)
    { x: x, y: y + height }, // 左下 (bl)
    { x: x, y: cy }, // 左中 (l)
  ];
}

// 检测点击是否在裁剪框内部
function isPointInCrop(x: number, y: number, crop: CropArea): boolean {
  const { x: cx, y: cy, width, height } = crop;
  return x >= cx && x <= cx + width && y >= cy && y <= cy + height;
}

// 检测点击位置返回裁剪框拖拽类型
function getCropDragTypeAtPoint(
  x: number,
  y: number,
  crop: CropArea,
): CropDragType {
  const threshold = HANDLE_RADIUS + 2;
  const handles = getCropHandles(crop);
  const handleTypes: CropDragType[] = [
    'resize-tl',
    'resize-t',
    'resize-tr',
    'resize-r',
    'resize-br',
    'resize-b',
    'resize-bl',
    'resize-l',
  ];

  // 检测控制点
  for (let i = 0; i < handles.length; i++) {
    const handle = handles[i];
    const dist = Math.sqrt((x - handle.x) ** 2 + (y - handle.y) ** 2);
    if (dist <= threshold) {
      return handleTypes[i];
    }
  }

  // 检测内部
  if (isPointInCrop(x, y, crop)) {
    return 'move';
  }

  return 'none';
}

// 在 Canvas 上绘制裁剪框
function drawCropBox(
  ctx: CanvasRenderingContext2D,
  crop: CropArea,
  imageWidth: number,
  imageHeight: number,
): void {
  const { x, y, width, height } = crop;

  ctx.save();

  // 绘制裁剪区域外的半透明遮罩（降低透明度）
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  
  // 上边遮罩
  ctx.fillRect(0, 0, imageWidth, y);
  // 下边遮罩
  ctx.fillRect(0, y + height, imageWidth, imageHeight - y - height);
  // 左边遮罩
  ctx.fillRect(0, y, x, height);
  // 右边遮罩
  ctx.fillRect(x + width, y, imageWidth - x - width, height);

  // 绘制裁剪框边框（虚线）
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.strokeRect(x, y, width, height);

  // 绘制网格线（三分线）
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  
  // 垂直三分线
  const thirdW = width / 3;
  ctx.beginPath();
  ctx.moveTo(x + thirdW, y);
  ctx.lineTo(x + thirdW, y + height);
  ctx.moveTo(x + thirdW * 2, y);
  ctx.lineTo(x + thirdW * 2, y + height);
  ctx.stroke();

  // 水平三分线
  const thirdH = height / 3;
  ctx.beginPath();
  ctx.moveTo(x, y + thirdH);
  ctx.lineTo(x + width, y + thirdH);
  ctx.moveTo(x, y + thirdH * 2);
  ctx.lineTo(x + width, y + thirdH * 2);
  ctx.stroke();

  // 绘制控制点
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 2;
  ctx.setLineDash([]);

  const handles = getCropHandles(crop);
  handles.forEach((handle) => {
    ctx.beginPath();
    ctx.arc(handle.x, handle.y, HANDLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.restore();
}

// ---------------------------------------------------------------------------
// 子组件
// ---------------------------------------------------------------------------

/** 左侧工具栏 */
const Toolbar: React.FC<{
  activeTool: ToolId;
  onSelectTool: (tool: ToolId) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}> = ({ activeTool, onSelectTool, canUndo, canRedo, onUndo, onRedo }) => (
  <aside className="toolbar w-[56px] h-full flex flex-col items-center py-3 gap-1 shrink-0">
    {TOOLS.map((tool) => {
      const isActive = activeTool === tool.id;
      return (
        <button
          key={tool.id}
          onClick={() => onSelectTool(tool.id)}
          className={`w-[40px] h-[40px] rounded-[12px] flex items-center justify-center cursor-pointer transition-colors duration-200 ${
            isActive
              ? 'tool-btn-active'
              : 'tool-btn'
          }`}
        >
          {tool.icon}
        </button>
      );
    })}

    {/* 分隔线 */}
    <div className="w-[24px] h-[1px] my-1 bg-[var(--color-editor-separator)]" />

    {/* 撤销 / 重做 */}
    <button
      onClick={onUndo}
      disabled={!canUndo}
      className={`w-[40px] h-[40px] rounded-[12px] flex items-center justify-center transition-colors duration-200 ${
        canUndo
          ? 'tool-btn cursor-pointer'
          : 'tool-btn cursor-not-allowed opacity-40'
      }`}
      title="撤销 (Ctrl+Z)"
    >
      <Undo2 size={18} />
    </button>
    <button
      onClick={onRedo}
      disabled={!canRedo}
      className={`w-[40px] h-[40px] rounded-[12px] flex items-center justify-center transition-colors duration-200 ${
        canRedo
          ? 'tool-btn cursor-pointer'
          : 'tool-btn cursor-not-allowed opacity-40'
      }`}
      title="重做 (Ctrl+Shift+Z)"
    >
      <Redo2 size={18} />
    </button>
  </aside>
);

/** 数值输入字段（只读显示） */
const PropField: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => (
  <div className="flex flex-col gap-1 flex-1">
    <span className="text-[10px] text-[var(--color-editor-hint)] font-body leading-none">
      {label}
    </span>
    <div
      className="prop-field h-[32px] rounded-[8px] px-[10px] flex items-center"
    >
      <span className="text-[12px] text-foreground font-body leading-none">
        {value}
      </span>
    </div>
  </div>
);

/** 可编辑的数值输入字段 */
const EditableField: React.FC<{
  label: string;
  value: number;
  onChange: (value: number) => void;
}> = ({ label, value, onChange }) => {
  const [localValue, setLocalValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // 同步外部值变化
  useEffect(() => {
    setLocalValue(String(Math.round(value)));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    const num = parseInt(localValue, 10);
    if (!isNaN(num)) {
      onChange(num);
    } else {
      setLocalValue(String(Math.round(value)));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  return (
    <div className="flex flex-col gap-1 flex-1">
      <span className="text-[10px] text-[var(--color-editor-hint)] font-body leading-none">
        {label}
      </span>
      <input
        ref={inputRef}
        type="number"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="prop-field h-[32px] rounded-[8px] px-[10px] flex items-center bg-transparent text-[12px] text-foreground font-body leading-none outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
      />
    </div>
  );
};

/** 颜色选择器 */
const ColorPicker: React.FC<{
  color: string;
  onChange: (color: string) => void;
}> = ({ color, onChange }) => {
  const colorInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
        stroke:
      </span>
      <div className="flex gap-1 flex-wrap">
        {PRESET_COLORS.map((presetColor) => (
          <button
            key={presetColor}
            onClick={() => onChange(presetColor)}
            className={`w-[20px] h-[20px] rounded-[4px] shrink-0 cursor-pointer transition-transform hover:scale-110 ${
              color === presetColor ? 'ring-2 ring-blue-500 ring-offset-1' : ''
            }`}
            style={{ backgroundColor: presetColor }}
          />
        ))}
        {/* 自定义颜色选择器 */}
        <button
          onClick={() => colorInputRef.current?.click()}
          className="w-[20px] h-[20px] rounded-[4px] shrink-0 cursor-pointer overflow-hidden border border-[var(--color-editor-separator)]"
          style={{
            background:
              'linear-gradient(135deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080)',
          }}
        >
          <input
            ref={colorInputRef}
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full opacity-0 cursor-pointer"
          />
        </button>
      </div>
    </div>
  );
};

/** 滑块控件 */
const SliderControl: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, unit = 'px', onChange }) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none w-12">
      {label}:
    </span>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="flex-1 h-1 accent-emerald-500 cursor-pointer"
    />
    <span className="text-[11px] text-foreground font-body leading-none w-10 text-right tabular-nums">
      {value}
      {unit}
    </span>
  </div>
);

/** 箭头样式切换 */
const ArrowStyleToggle: React.FC<{
  style: ArrowStyle;
  onChange: (style: ArrowStyle) => void;
}> = ({ style, onChange }) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
      arrow:
    </span>
    <div className="flex gap-1">
      <button
        onClick={() => onChange('single')}
        className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
          style === 'single'
            ? 'bg-[var(--color-accent)] text-black'
            : 'prop-field-sm'
        }`}
      >
        <ChevronRight size={14} />
        <span className="text-[11px] font-body leading-none">single</span>
      </button>
      <button
        onClick={() => onChange('double')}
        className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
          style === 'double'
            ? 'bg-[var(--color-accent)] text-black'
            : 'prop-field-sm'
        }`}
      >
        <ChevronRight size={14} className="rotate-180" />
        <ChevronRight size={14} />
        <span className="text-[11px] font-body leading-none">double</span>
      </button>
    </div>
  </div>
);

/** 矩形边框样式切换 */
const RectBorderStyleToggle: React.FC<{
  borderStyle: RectBorderStyle;
  onChange: (style: RectBorderStyle) => void;
}> = ({ borderStyle, onChange }) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
      border:
    </span>
    <div className="flex gap-1">
      <button
        onClick={() => onChange('solid')}
        className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
          borderStyle === 'solid'
            ? 'bg-[var(--color-accent)] text-black'
            : 'prop-field-sm'
        }`}
      >
        <div className="w-4 h-0.5 bg-current" />
        <span className="text-[11px] font-body leading-none">solid</span>
      </button>
      <button
        onClick={() => onChange('dashed')}
        className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
          borderStyle === 'dashed'
            ? 'bg-[var(--color-accent)] text-black'
            : 'prop-field-sm'
        }`}
      >
        <div className="w-4 h-0.5 border-t-2 border-dashed border-current" />
        <span className="text-[11px] font-body leading-none">dashed</span>
      </button>
    </div>
  </div>
);

/** 文字粗体切换 */
const FontWeightToggle: React.FC<{
  fontWeight: 'normal' | 'bold';
  onChange: (weight: 'normal' | 'bold') => void;
}> = ({ fontWeight, onChange }) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
      weight:
    </span>
    <div className="flex gap-1">
      <button
        onClick={() => onChange('normal')}
        className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
          fontWeight === 'normal'
            ? 'bg-[var(--color-accent)] text-black'
            : 'prop-field-sm'
        }`}
      >
        <span className="text-[11px] font-body leading-none">normal</span>
      </button>
      <button
        onClick={() => onChange('bold')}
        className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
          fontWeight === 'bold'
            ? 'bg-[var(--color-accent)] text-black'
            : 'prop-field-sm'
        }`}
      >
        <span className="text-[11px] font-body font-bold leading-none">bold</span>
      </button>
    </div>
  </div>
);

/** 文字斜体切换 */
const FontStyleToggle: React.FC<{
  fontStyle: 'normal' | 'italic';
  onChange: (style: 'normal' | 'italic') => void;
}> = ({ fontStyle, onChange }) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
      style:
    </span>
    <div className="flex gap-1">
      <button
        onClick={() => onChange('normal')}
        className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
          fontStyle === 'normal'
            ? 'bg-[var(--color-accent)] text-black'
            : 'prop-field-sm'
        }`}
      >
        <span className="text-[11px] font-body leading-none">normal</span>
      </button>
      <button
        onClick={() => onChange('italic')}
        className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
          fontStyle === 'italic'
            ? 'bg-[var(--color-accent)] text-black'
            : 'prop-field-sm'
        }`}
      >
        <span className="text-[11px] font-body italic leading-none">italic</span>
      </button>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// 图片容器设置组件
// ---------------------------------------------------------------------------

/** 可折叠区块 */
const CollapsibleSection: React.FC<{
  title: string;
  defaultOpen?: boolean;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  children: React.ReactNode;
}> = ({ title, defaultOpen = true, enabled, onToggle, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasToggle = enabled !== undefined && onToggle !== undefined;

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 cursor-pointer"
        >
          <ChevronRight
            size={12}
            style={{
              color: 'var(--color-accent-orange)',
              transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
            }}
          />
          <span
            className="text-[11px] font-body font-semibold"
            style={{ color: 'var(--color-accent-orange)' }}
          >
            {title}
          </span>
        </button>
        {hasToggle && (
          <ToggleSwitch enabled={enabled!} onChange={onToggle!} />
        )}
      </div>
      {isOpen && (!hasToggle || enabled) && (
        <div className="pl-3 flex flex-col gap-[8px]">{children}</div>
      )}
    </div>
  );
};

/** 开关控件 */
const ToggleSwitch: React.FC<{
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}> = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`w-[36px] h-[20px] rounded-full relative cursor-pointer transition-colors border ${
      enabled
        ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
        : 'bg-transparent border-[var(--color-editor-hint)]'
    }`}
  >
    <div
      className={`w-[16px] h-[16px] rounded-full absolute top-[1px] transition-transform ${
        enabled ? 'translate-x-[18px] bg-black' : 'translate-x-[1px] bg-[var(--color-editor-hint)]'
      }`}
    />
  </button>
);

/** 下拉选择器 */
const SelectControl: React.FC<{
  value: string;
  options: { name: string; value: string }[];
  onChange: (value: string) => void;
}> = ({ value, options, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="prop-field-sm h-[28px] px-2 rounded-[6px] text-[11px] font-body bg-transparent text-foreground cursor-pointer outline-none"
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value} className="bg-[var(--color-bg)]">
        {opt.name}
      </option>
    ))}
  </select>
);

/** 背景预设按钮 */
const BackgroundPresetButton: React.FC<{
  preset: (typeof BACKGROUND_PRESETS)[number];
  isSelected: boolean;
  onClick: () => void;
}> = ({ preset, isSelected, onClick }) => {
  const getBackground = () => {
    if (preset.type === 'solid') {
      return preset.color === 'transparent'
        ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
        : preset.color;
    }
    return `linear-gradient(${preset.gradientAngle}deg, ${preset.gradientColors[0]}, ${preset.gradientColors[1]})`;
  };

  return (
    <button
      onClick={onClick}
      className={`w-[24px] h-[24px] rounded-[4px] shrink-0 cursor-pointer border-2 transition-colors ${
        isSelected ? 'border-[var(--color-accent)]' : 'border-transparent'
      }`}
      style={{
        background: getBackground(),
        backgroundSize: preset.color === 'transparent' ? '8px 8px' : 'auto',
        backgroundPosition: preset.color === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto',
      }}
      title={preset.name}
    />
  );
};

/** 阴影预设按钮 */
const ShadowPresetButton: React.FC<{
  preset: (typeof SHADOW_PRESETS)[number];
  isSelected: boolean;
  onClick: () => void;
}> = ({ preset, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
      isSelected ? 'bg-[var(--color-accent)] text-black' : 'prop-field-sm'
    }`}
  >
    <span className="text-[10px] font-body leading-none">{preset.name}</span>
  </button>
);

/** 图片容器设置面板 */
const FrameSettings: React.FC<{
  settings: ImageFrameSettings;
  onUpdate: (updates: Partial<ImageFrameSettings>) => void;
}> = ({ settings, onUpdate }) => {
  return (
    <div className="flex flex-col gap-3">
        <span
          className="text-[11px] font-body font-semibold"
          style={{ color: 'var(--color-accent-orange)' }}
        >
          图片容器
        </span>

      {/* 背景设置 */}
      <CollapsibleSection title="背景" defaultOpen={true}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
            type:
          </span>
          <SelectControl
            value={settings.background.type}
            options={[
              { name: '纯色', value: 'solid' },
              { name: '线性渐变', value: 'linear' },
              { name: '径向渐变', value: 'radial' },
            ]}
            onChange={(type) =>
              onUpdate({
                background: { ...settings.background, type: type as 'solid' | 'linear' | 'radial' },
              })
            }
          />
        </div>
        {settings.background.type === 'solid' ? (
          <ColorPicker
            color={settings.background.color}
            onChange={(color) =>
              onUpdate({ background: { ...settings.background, color } })
            }
          />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
                起始色:
              </span>
              <div className="flex gap-1">
                {PRESET_COLORS.slice(0, 4).map((color) => (
                  <button
                    key={color}
                    onClick={() =>
                      onUpdate({
                        background: {
                          ...settings.background,
                          gradientColors: [color, settings.background.gradientColors[1]],
                        },
                      })
                    }
                    className="w-[20px] h-[20px] rounded-[4px] shrink-0 cursor-pointer border border-[var(--color-border)]"
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={settings.background.gradientColors[0]}
                  onChange={(e) =>
                    onUpdate({
                      background: {
                        ...settings.background,
                        gradientColors: [e.target.value, settings.background.gradientColors[1]],
                      },
                    })
                  }
                  className="w-[20px] h-[20px] rounded-[4px] cursor-pointer bg-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
                结束色:
              </span>
              <div className="flex gap-1">
                {PRESET_COLORS.slice(0, 4).map((color) => (
                  <button
                    key={color}
                    onClick={() =>
                      onUpdate({
                        background: {
                          ...settings.background,
                          gradientColors: [settings.background.gradientColors[0], color],
                        },
                      })
                    }
                    className="w-[20px] h-[20px] rounded-[4px] shrink-0 cursor-pointer border border-[var(--color-border)]"
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={settings.background.gradientColors[1]}
                  onChange={(e) =>
                    onUpdate({
                      background: {
                        ...settings.background,
                        gradientColors: [settings.background.gradientColors[0], e.target.value],
                      },
                    })
                  }
                  className="w-[20px] h-[20px] rounded-[4px] cursor-pointer bg-transparent"
                />
              </div>
            </div>
            <SliderControl
              label="角度"
              value={settings.background.gradientAngle}
              min={0}
              max={360}
              onChange={(gradientAngle) =>
                onUpdate({ background: { ...settings.background, gradientAngle } })
              }
            />
          </>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {BACKGROUND_PRESETS.map((preset) => (
            <BackgroundPresetButton
              key={preset.name}
              preset={preset}
              isSelected={
                preset.type === settings.background.type &&
                (preset.type === 'solid'
                  ? preset.color === settings.background.color
                  : preset.gradientColors?.[0] === settings.background.gradientColors[0] &&
                    preset.gradientColors?.[1] === settings.background.gradientColors[1])
              }
              onClick={() => {
                if (preset.type === 'solid') {
                  onUpdate({
                    background: {
                      ...settings.background,
                      type: 'solid',
                      color: preset.color,
                    },
                  });
                } else {
                  onUpdate({
                    background: {
                      ...settings.background,
                      type: 'linear',
                      gradientColors: preset.gradientColors,
                      gradientAngle: preset.gradientAngle,
                    },
                  });
                }
              }}
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* 边距设置 */}
      <CollapsibleSection title="边距">
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onUpdate({
                padding: { ...settings.padding, linked: !settings.padding.linked },
              })
            }
            className={`w-[20px] h-[20px] rounded-[4px] flex items-center justify-center cursor-pointer transition-colors ${
              settings.padding.linked
                ? 'bg-[var(--color-accent)] text-black'
                : 'prop-field-sm'
            }`}
            title={settings.padding.linked ? 'Unlink' : 'Link'}
          >
            <span className="text-[10px] font-body leading-none">
              {settings.padding.linked ? '🔗' : '⛓️‍💥'}
            </span>
          </button>
          <div className="flex gap-1 flex-1">
            <EditableField
              label="上"
              value={settings.padding.top}
              onChange={(top) =>
                onUpdate({
                  padding: settings.padding.linked
                    ? { ...settings.padding, top, right: top, bottom: top, left: top }
                    : { ...settings.padding, top },
                })
              }
            />
            <EditableField
              label="右"
              value={settings.padding.right}
              onChange={(right) =>
                onUpdate({
                  padding: settings.padding.linked
                    ? { ...settings.padding, top: right, right, bottom: right, left: right }
                    : { ...settings.padding, right },
                })
              }
            />
          </div>
        </div>
        <div className="flex gap-1 pl-7">
          <EditableField
            label="下"
            value={settings.padding.bottom}
            onChange={(bottom) =>
              onUpdate({
                padding: settings.padding.linked
                  ? { ...settings.padding, top: bottom, right: bottom, bottom, left: bottom }
                  : { ...settings.padding, bottom },
              })
            }
          />
          <EditableField
            label="左"
            value={settings.padding.left}
            onChange={(left) =>
              onUpdate({
                padding: settings.padding.linked
                  ? { ...settings.padding, top: left, right: left, bottom: left, left }
                  : { ...settings.padding, left },
              })
            }
          />
        </div>
      </CollapsibleSection>

      {/* 圆角设置 */}
      <CollapsibleSection title="圆角">
        <SliderControl
          label="圆角"
          value={settings.borderRadius.value}
          min={0}
          max={100}
          onChange={(value) =>
            onUpdate({ borderRadius: { ...settings.borderRadius, value } })
          }
        />
      </CollapsibleSection>

      {/* 阴影设置 */}
      <CollapsibleSection
        title="阴影"
        enabled={settings.shadow.enabled}
        onToggle={(enabled) =>
          onUpdate({ shadow: { ...settings.shadow, enabled } })
        }
      >
        <ColorPicker
          color={settings.shadow.color}
          onChange={(color) =>
            onUpdate({ shadow: { ...settings.shadow, color } })
          }
        />
        <SliderControl
          label="模糊"
          value={settings.shadow.blur}
          min={0}
          max={100}
          onChange={(blur) =>
            onUpdate({ shadow: { ...settings.shadow, blur } })
          }
        />
        <div className="flex gap-2">
          <EditableField
            label="X"
            value={settings.shadow.offsetX}
            onChange={(offsetX) =>
              onUpdate({ shadow: { ...settings.shadow, offsetX } })
            }
          />
          <EditableField
            label="Y"
            value={settings.shadow.offsetY}
            onChange={(offsetY) =>
              onUpdate({ shadow: { ...settings.shadow, offsetY } })
            }
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {SHADOW_PRESETS.map((preset) => (
            <ShadowPresetButton
              key={preset.name}
              preset={preset}
              isSelected={
                settings.shadow.enabled === preset.enabled &&
                settings.shadow.blur === preset.blur
              }
              onClick={() =>
                onUpdate({
                  shadow: {
                    ...settings.shadow,
                    enabled: preset.enabled,
                    blur: preset.blur,
                    offsetX: preset.offsetX,
                    offsetY: preset.offsetY,
                  },
                })
              }
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* 比例设置 */}
      <CollapsibleSection title="比例">
        <SelectControl
          value={settings.aspectRatio}
          options={ASPECT_RATIO_PRESETS}
          onChange={(aspectRatio) => onUpdate({ aspectRatio })}
        />
      </CollapsibleSection>

      {/* 窗口控件设置 */}
      <CollapsibleSection
        title="窗口控件"
        enabled={settings.windowControl.enabled}
        onToggle={(enabled) =>
          onUpdate({ windowControl: { ...settings.windowControl, enabled } })
        }
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
            样式:
          </span>
          <div className="flex gap-1">
            <button
              onClick={() =>
                onUpdate({
                  windowControl: { ...settings.windowControl, style: 'macos' },
                })
              }
              className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
                settings.windowControl.style === 'macos'
                  ? 'bg-[var(--color-accent)] text-black'
                  : 'prop-field-sm'
              }`}
            >
              <span className="text-[11px] font-body leading-none">macOS 风格</span>
            </button>
            <button
              onClick={() =>
                onUpdate({
                  windowControl: { ...settings.windowControl, style: 'windows' },
                })
              }
              className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
                settings.windowControl.style === 'windows'
                  ? 'bg-[var(--color-accent)] text-black'
                  : 'prop-field-sm'
              }`}
            >
              <span className="text-[11px] font-body leading-none">Windows 风格</span>
            </button>
          </div>
        </div>
      </CollapsibleSection>

      {/* 水印设置 */}
      <CollapsibleSection
        title="水印"
        enabled={settings.watermark.enabled}
        onToggle={(enabled) =>
          onUpdate({ watermark: { ...settings.watermark, enabled } })
        }
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
            文字:
          </span>
          <input
            type="text"
            value={settings.watermark.text}
            onChange={(e) =>
              onUpdate({
                watermark: { ...settings.watermark, text: e.target.value },
              })
            }
            placeholder="水印文字"
            className="prop-field-sm h-[28px] px-2 rounded-[6px] flex-1 text-[11px] font-body bg-transparent text-foreground outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
            位置:
          </span>
          <SelectControl
            value={settings.watermark.position}
            options={[
              { name: '右下', value: 'bottom-right' },
              { name: '左下', value: 'bottom-left' },
              { name: '右上', value: 'top-right' },
              { name: '左上', value: 'top-left' },
              { name: '居中', value: 'center' },
            ]}
            onChange={(position) =>
              onUpdate({
                watermark: {
                  ...settings.watermark,
                  position: position as ImageFrameSettings['watermark']['position'],
                },
              })
            }
          />
        </div>
        <SliderControl
          label="透明度"
          value={settings.watermark.opacity}
          min={0}
          max={100}
          unit="%"
          onChange={(opacity) =>
            onUpdate({ watermark: { ...settings.watermark, opacity } })
          }
        />
        <SliderControl
          label="大小"
          value={settings.watermark.fontSize}
          min={8}
          max={48}
          onChange={(fontSize) =>
            onUpdate({ watermark: { ...settings.watermark, fontSize } })
          }
        />
      </CollapsibleSection>
    </div>
  );
};

/** 右侧属性面板 */
const PropertiesPanel: React.FC<{
  selectedArrow: ArrowShape | null;
  onUpdateArrow: (updates: Partial<ArrowShape>) => void;
  selectedRect: RectShape | null;
  onUpdateRect: (updates: Partial<RectShape>) => void;
  selectedText: TextShape | null;
  onUpdateText: (updates: Partial<TextShape>) => void;
  selectedMosaic: MosaicShape | null;
  onUpdateMosaic: (updates: Partial<MosaicShape>) => void;
  frameSettings: ImageFrameSettings;
  onUpdateFrameSettings: (updates: Partial<ImageFrameSettings>) => void;
}> = ({ selectedArrow, onUpdateArrow, selectedRect, onUpdateRect, selectedText, onUpdateText, selectedMosaic, onUpdateMosaic, frameSettings, onUpdateFrameSettings }) => {
  // 选中类型：arrow, rect, text, mosaic 或 none
  const selectionType: 'arrow' | 'rect' | 'text' | 'mosaic' | 'none' = selectedArrow
    ? 'arrow'
    : selectedRect
      ? 'rect'
      : selectedText
        ? 'text'
        : selectedMosaic
          ? 'mosaic'
          : 'none';

  // 箭头属性处理
  const handleArrowColorChange = (color: string) => {
    if (selectedArrow) onUpdateArrow({ color });
  };
  const handleArrowStrokeWidthChange = (strokeWidth: number) => {
    if (selectedArrow) onUpdateArrow({ strokeWidth });
  };
  const handleHeadSizeChange = (headSize: number) => {
    if (selectedArrow) onUpdateArrow({ headSize });
  };
  const handleStyleChange = (style: ArrowStyle) => {
    if (selectedArrow) onUpdateArrow({ style });
  };

  // 矩形属性处理
  const handleRectColorChange = (color: string) => {
    if (selectedRect) onUpdateRect({ color });
  };
  const handleRectStrokeWidthChange = (strokeWidth: number) => {
    if (selectedRect) onUpdateRect({ strokeWidth });
  };
  const handleFillOpacityChange = (fillOpacity: number) => {
    if (selectedRect) onUpdateRect({ fillOpacity });
  };
  const handleBorderStyleChange = (borderStyle: RectBorderStyle) => {
    if (selectedRect) onUpdateRect({ borderStyle });
  };

  // 文字属性处理
  const handleTextColorChange = (color: string) => {
    if (selectedText) onUpdateText({ color });
  };
  const handleFontSizeChange = (fontSize: number) => {
    if (selectedText) onUpdateText({ fontSize });
  };
  const handleFontWeightChange = (fontWeight: 'normal' | 'bold') => {
    if (selectedText) onUpdateText({ fontWeight });
  };
  const handleFontStyleChange = (fontStyle: 'normal' | 'italic') => {
    if (selectedText) onUpdateText({ fontStyle });
  };

  // 马赛克属性处理
  const handleBlockSizeChange = (blockSize: number) => {
    if (selectedMosaic) onUpdateMosaic({ blockSize });
  };
  const handleMosaicOpacityChange = (opacity: number) => {
    if (selectedMosaic) onUpdateMosaic({ opacity });
  };

  return (
    <aside className="properties-panel w-[350px] h-full flex flex-col gap-4 p-5 shrink-0 overflow-y-auto">
      {/* 位置区域 */}
      <div className="flex flex-col gap-[10px]">
        <span
          className="text-[11px] font-body font-semibold"
          style={{ color: 'var(--color-accent-orange)' }}
        >
          位置
        </span>
        {selectionType === 'arrow' && selectedArrow ? (
          <>
            <div className="flex gap-2">
              <EditableField
                label="起点 X"
                value={selectedArrow.startX}
                onChange={(val) => onUpdateArrow({ startX: val })}
              />
              <EditableField
                label="起点 Y"
                value={selectedArrow.startY}
                onChange={(val) => onUpdateArrow({ startY: val })}
              />
            </div>
            <div className="flex gap-2">
              <EditableField
                label="终点 X"
                value={selectedArrow.endX}
                onChange={(val) => onUpdateArrow({ endX: val })}
              />
              <EditableField
                label="终点 Y"
                value={selectedArrow.endY}
                onChange={(val) => onUpdateArrow({ endY: val })}
              />
            </div>
          </>
        ) : selectionType === 'rect' && selectedRect ? (
          <>
            <div className="flex gap-2">
              <EditableField
                label="X"
                value={selectedRect.x}
                onChange={(val) => onUpdateRect({ x: val })}
              />
              <EditableField
                label="Y"
                value={selectedRect.y}
                onChange={(val) => onUpdateRect({ y: val })}
              />
            </div>
            <div className="flex gap-2">
              <EditableField
                label="宽"
                value={selectedRect.width}
                onChange={(val) => onUpdateRect({ width: val })}
              />
              <EditableField
                label="高"
                value={selectedRect.height}
                onChange={(val) => onUpdateRect({ height: val })}
              />
            </div>
          </>
        ) : selectionType === 'text' && selectedText ? (
          <>
            <div className="flex gap-2">
              <EditableField
                label="X"
                value={selectedText.x}
                onChange={(val) => onUpdateText({ x: val })}
              />
              <EditableField
                label="Y"
                value={selectedText.y}
                onChange={(val) => onUpdateText({ y: val })}
              />
            </div>
          </>
        ) : selectionType === 'mosaic' && selectedMosaic ? (
          <>
            <div className="flex gap-2">
              <EditableField
                label="X"
                value={selectedMosaic.x}
                onChange={(val) => onUpdateMosaic({ x: val })}
              />
              <EditableField
                label="Y"
                value={selectedMosaic.y}
                onChange={(val) => onUpdateMosaic({ y: val })}
              />
            </div>
            <div className="flex gap-2">
              <EditableField
                label="宽"
                value={selectedMosaic.width}
                onChange={(val) => onUpdateMosaic({ width: val })}
              />
              <EditableField
                label="高"
                value={selectedMosaic.height}
                onChange={(val) => onUpdateMosaic({ height: val })}
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <PropField label="X" value="0" />
              <PropField label="Y" value="0" />
            </div>
            <div className="flex gap-2">
              <PropField label="宽" value="0" />
              <PropField label="高" value="0" />
            </div>
          </>
        )}
      </div>

      {/* [style] 区域 */}
      {selectionType === 'arrow' && selectedArrow ? (
        <div className="flex flex-col gap-[10px]">
          <span
            className="text-[11px] font-body font-semibold"
            style={{ color: 'var(--color-accent-orange)' }}
          >
            箭头样式
          </span>
          <ColorPicker
            color={selectedArrow.color}
            onChange={handleArrowColorChange}
          />
          <SliderControl
            label="线宽"
            value={selectedArrow.strokeWidth}
            min={1}
            max={10}
            onChange={handleArrowStrokeWidthChange}
          />
          <SliderControl
            label="箭头大小"
            value={selectedArrow.headSize}
            min={5}
            max={30}
            onChange={handleHeadSizeChange}
          />
          <ArrowStyleToggle
            style={selectedArrow.style}
            onChange={handleStyleChange}
          />
        </div>
      ) : selectionType === 'rect' && selectedRect ? (
        <div className="flex flex-col gap-[10px]">
          <span
            className="text-[11px] font-body font-semibold"
            style={{ color: 'var(--color-accent-orange)' }}
          >
            矩形样式
          </span>
          <ColorPicker
            color={selectedRect.color}
            onChange={handleRectColorChange}
          />
          <SliderControl
            label="线宽"
            value={selectedRect.strokeWidth}
            min={1}
            max={10}
            onChange={handleRectStrokeWidthChange}
          />
          <SliderControl
            label="填充"
            value={selectedRect.fillOpacity}
            min={0}
            max={100}
            unit="%"
            onChange={handleFillOpacityChange}
          />
          <RectBorderStyleToggle
            borderStyle={selectedRect.borderStyle}
            onChange={handleBorderStyleChange}
          />
        </div>
      ) : selectionType === 'text' && selectedText ? (
        <div className="flex flex-col gap-[10px]">
          <span
            className="text-[11px] font-body font-semibold"
            style={{ color: 'var(--color-accent-orange)' }}
          >
            文字样式
          </span>
          <ColorPicker
            color={selectedText.color}
            onChange={handleTextColorChange}
          />
          <SliderControl
            label="字号"
            value={selectedText.fontSize}
            min={8}
            max={120}
            onChange={handleFontSizeChange}
          />
          <FontWeightToggle
            fontWeight={selectedText.fontWeight}
            onChange={handleFontWeightChange}
          />
          <FontStyleToggle
            fontStyle={selectedText.fontStyle}
            onChange={handleFontStyleChange}
          />
        </div>
      ) : selectionType === 'mosaic' && selectedMosaic ? (
        <div className="flex flex-col gap-[10px]">
          <span
            className="text-[11px] font-body font-semibold"
            style={{ color: 'var(--color-accent-orange)' }}
          >
            马赛克样式
          </span>
          <SliderControl
            label="方块大小"
            value={selectedMosaic.blockSize}
            min={5}
            max={50}
            onChange={handleBlockSizeChange}
          />
          <SliderControl
            label="透明度"
            value={selectedMosaic.opacity}
            min={0}
            max={100}
            unit="%"
            onChange={handleMosaicOpacityChange}
          />
        </div>
      ) : null}

      {/* [frame] 区域 - 未选中标注时显示 */}
      {selectionType === 'none' && (
        <FrameSettings
          settings={frameSettings}
          onUpdate={onUpdateFrameSettings}
        />
      )}

      {/* 操作按钮 */}
      <div className="flex flex-col gap-2 mt-auto">
        <button className="export-btn w-full h-[40px] rounded-[12px] flex items-center justify-center gap-2 cursor-pointer">
          <Download size={16} style={{ color: '#0D0D0D' }} />
          <span
            className="text-[12px] font-body font-semibold leading-none"
            style={{ color: '#0D0D0D' }}
          >
            导出图片
          </span>
        </button>
        <button className="copy-btn w-full h-[40px] rounded-[12px] flex items-center justify-center gap-2 cursor-pointer">
          <ClipboardCopy size={16} className="text-[var(--color-editor-hint)]" />
          <span className="text-[12px] font-body font-semibold leading-none text-[var(--color-editor-hint)]">
            复制到剪贴板
          </span>
        </button>
      </div>
    </aside>
  );
};

/** 空画布上传提示 */
const UploadPlaceholder: React.FC<{
  onImageLoad: (dataUrl: string) => void;
}> = ({ onImageLoad }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 拖拽事件
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files[0];
      if (!file || !isAcceptedImageType(file)) return;
      const dataUrl = await readFileAsDataUrl(file);
      onImageLoad(dataUrl);
    },
    [onImageLoad],
  );

  // 点击上传
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !isAcceptedImageType(file)) return;
      const dataUrl = await readFileAsDataUrl(file);
      onImageLoad(dataUrl);
    },
    [onImageLoad],
  );

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 cursor-pointer select-none"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className="w-[64px] h-[64px] rounded-[16px] flex items-center justify-center bg-[var(--color-editor-upload-bg)]">
        <ImagePlus size={28} style={{ color: 'var(--color-editor-upload-icon)' }} />
      </div>
      <div className="text-center">
        <p className="text-[13px] text-[var(--color-editor-comment)] font-body mb-1">
          // drop image here or paste
        </p>
        <p className="text-[11px] text-[var(--color-editor-hint)] font-body">
          click to browse
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

/** 画布中显示的图片 */
const CanvasImage: React.FC<{
  src: string;
  onSizeChange?: (w: number, h: number) => void;
  onNaturalSizeChange?: (w: number, h: number) => void;
}> = ({ src, onSizeChange, onNaturalSizeChange }) => {
  return (
    <img
      src={src}
      alt="编辑图片"
      onLoad={(e) => {
        const img = e.currentTarget;
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        // 返回原始尺寸
        onNaturalSizeChange?.(nw, nh);
        // 计算实际显示尺寸（保持宽高比）
        const maxW = Math.min(MAX_IMG_W, nw);
        const maxH = Math.min(MAX_IMG_H, nh);
        const ratio = Math.min(maxW / nw, maxH / nh);
        const displayW = nw * ratio;
        const displayH = nh * ratio;
        onSizeChange?.(displayW, displayH);
      }}
      className="rounded-[8px] shadow-lg"
      draggable={false}
      style={{
        maxWidth: MAX_IMG_W,
        maxHeight: MAX_IMG_H,
        objectFit: 'contain',
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// 主组件
// ---------------------------------------------------------------------------

const App: React.FC = () => {
  const [source, setSource] = useState<EditorSource | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolId>('select');
  const initialized = useRef(false);

  // 图片容器设置
  const [frameSettings, setFrameSettings] = useState<ImageFrameSettings>(DEFAULT_FRAME_SETTINGS);

  // 画布缩放/平移状态
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(scale);
  const offsetRef = useRef(offset);

  // 图片加载后计算居中偏移
  const handleImageSizeChange = useCallback(
    (w: number, h: number) => {
      // 存储显示尺寸（用于裁剪坐标转换）
      setImageDisplaySize({ width: w, height: h });

      const container = canvasRef.current;
      if (!container) return;
      const containerW = container.clientWidth;
      const containerH = container.clientHeight;
      // 计算居中偏移
      const newOffset = {
        x: (containerW - w) / 2,
        y: (containerH - h) / 2,
      };
      offsetRef.current = newOffset;
      setOffset(newOffset);
    },
    [],
  );

  // 图片原始尺寸变化（用于裁剪）
  const handleImageNaturalSizeChange = useCallback((w: number, h: number) => {
    setImageNaturalSize({ width: w, height: h });
  }, []);

  // 箭头相关状态
  const [arrows, setArrows] = useState<ArrowShape[]>([]);
  const [selectedArrowIds, setSelectedArrowIds] = useState<string[]>([]);
  const drawingArrow = useRef<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const isDrawingArrow = useRef(false);

  // 箭头拖拽状态
  const draggingRef = useRef<{
    type: DragType;
    arrowId: string;
    startX: number;
    startY: number;
    arrowStart: { x: number; y: number };
    arrowEnd: { x: number; y: number };
  } | null>(null);

  // 矩形相关状态
  const [rects, setRects] = useState<RectShape[]>([]);
  const [selectedRectIds, setSelectedRectIds] = useState<string[]>([]);
  const drawingRect = useRef<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const isDrawingRect = useRef(false);

  // 矩形拖拽状态
  const draggingRectRef = useRef<{
    type: RectDragType;
    rectId: string;
    startX: number;
    startY: number;
    rectOrig: { x: number; y: number; width: number; height: number };
  } | null>(null);

  // 文字相关状态
  const [texts, setTexts] = useState<TextShape[]>([]);
  const [selectedTextIds, setSelectedTextIds] = useState<string[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState('');
  const textInputRef = useRef<HTMLInputElement>(null);

  // 文字拖拽状态
  const draggingTextRef = useRef<{
    type: TextDragType;
    textId: string;
    startX: number;
    startY: number;
    textOrig: { x: number; y: number; fontSize: number };
  } | null>(null);

  // 马赛克相关状态
  const [mosaics, setMosaics] = useState<MosaicShape[]>([]);
  const [selectedMosaicIds, setSelectedMosaicIds] = useState<string[]>([]);
  const drawingMosaic = useRef<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const isDrawingMosaic = useRef(false);

  // 马赛克拖拽状态
  const draggingMosaicRef = useRef<{
    type: MosaicDragType;
    mosaicId: string;
    startX: number;
    startY: number;
    mosaicOrig: { x: number; y: number; width: number; height: number };
  } | null>(null);

  // 裁剪相关状态
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [imageDisplaySize, setImageDisplaySize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const drawingCrop = useRef<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const isDrawingCrop = useRef(false);

  // 裁剪框拖拽状态
  const draggingCropRef = useRef<{
    type: CropDragType;
    startX: number;
    startY: number;
    cropOrig: { x: number; y: number; width: number; height: number };
  } | null>(null);

  // Canvas 引用
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // 默认箭头样式（用于创建新箭头）
  const arrowStyleRef = useRef(DEFAULT_ARROW_STYLE);

  // 默认矩形样式（用于创建新矩形）
  const rectStyleRef = useRef(DEFAULT_RECT_STYLE);

  // 默认文字样式（用于创建新文字）
  const textStyleRef = useRef(DEFAULT_TEXT_STYLE);

  // 默认马赛克样式（用于创建新马赛克）
  const mosaicStyleRef = useRef(DEFAULT_MOSAIC_STYLE);

  // 使用 ref 避免闭包陈旧状态
  const arrowsRef = useRef(arrows);
  arrowsRef.current = arrows;

  // 矩形 ref
  const rectsRef = useRef(rects);
  rectsRef.current = rects;

  // 文字 ref
  const textsRef = useRef(texts);
  textsRef.current = texts;

  // 马赛克 ref
  const mosaicsRef = useRef(mosaics);
  mosaicsRef.current = mosaics;

  // 选中 ID ref（避免事件处理中的闭包问题）
  const selectedArrowIdsRef = useRef(selectedArrowIds);
  selectedArrowIdsRef.current = selectedArrowIds;

  const selectedRectIdsRef = useRef(selectedRectIds);
  selectedRectIdsRef.current = selectedRectIds;

  const selectedTextIdsRef = useRef(selectedTextIds);
  selectedTextIdsRef.current = selectedTextIds;

  const selectedMosaicIdsRef = useRef(selectedMosaicIds);
  selectedMosaicIdsRef.current = selectedMosaicIds;

  // 框选状态
  const isMarqueeSelecting = useRef(false);
  const marqueeStart = useRef<{ x: number; y: number } | null>(null);
  const marqueeEnd = useRef<{ x: number; y: number } | null>(null);

  // 裁剪区域 ref
  const cropAreaRef = useRef(cropArea);
  cropAreaRef.current = cropArea;

  // 图片原始尺寸 ref
  const imageNaturalSizeRef = useRef(imageNaturalSize);
  imageNaturalSizeRef.current = imageNaturalSize;

  // 图片显示尺寸 ref
  const imageDisplaySizeRef = useRef(imageDisplaySize);
  imageDisplaySizeRef.current = imageDisplaySize;
  imageNaturalSizeRef.current = imageNaturalSize;

  // ---------------------------------------------------------------------------
  // 历史记录（撤销/恢复）
  // ---------------------------------------------------------------------------
  const historyActions = useEditorHistory();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // 更新撤销/恢复按钮状态
  const updateHistoryButtons = useCallback(() => {
    setCanUndo(historyActions.canUndo());
    setCanRedo(historyActions.canRedo());
  }, [historyActions]);

  // 推送当前状态到历史记录
  const pushHistory = useCallback(() => {
    // 深拷贝数组避免引用污染
    const state: EditorState = {
      arrows: JSON.parse(JSON.stringify(arrowsRef.current)),
      rects: JSON.parse(JSON.stringify(rectsRef.current)),
      texts: JSON.parse(JSON.stringify(textsRef.current)),
      mosaics: JSON.parse(JSON.stringify(mosaicsRef.current)),
      imageData: imageData,
      view: {
        scale: scaleRef.current,
        offset: { ...offsetRef.current },
      },
      selectedArrowIds: [...selectedArrowIdsRef.current],
      selectedRectIds: [...selectedRectIdsRef.current],
      selectedTextIds: [...selectedTextIdsRef.current],
      selectedMosaicIds: [...selectedMosaicIdsRef.current],
    };
    historyActions.pushState(state);
    updateHistoryButtons();
  }, [historyActions, imageData, updateHistoryButtons]);

  // 撤销操作
  const handleUndo = useCallback(() => {
    const prevState = historyActions.undo();
    if (prevState) {
      setArrows(prevState.arrows);
      setRects(prevState.rects);
      setTexts(prevState.texts);
      setMosaics(prevState.mosaics);
      // 同步 ref
      arrowsRef.current = prevState.arrows;
      rectsRef.current = prevState.rects;
      textsRef.current = prevState.texts;
      mosaicsRef.current = prevState.mosaics;
      if (prevState.imageData && prevState.imageData !== imageData) {
        setImageData(prevState.imageData);
      }
      setScale(prevState.view.scale);
      setOffset(prevState.view.offset);
      scaleRef.current = prevState.view.scale;
      offsetRef.current = prevState.view.offset;
      setSelectedArrowIds(prevState.selectedArrowIds);
      setSelectedRectIds(prevState.selectedRectIds);
      setSelectedTextIds(prevState.selectedTextIds);
      setSelectedMosaicIds(prevState.selectedMosaicIds);
    }
    updateHistoryButtons();
  }, [historyActions, imageData, updateHistoryButtons]);

  // 恢复操作
  const handleRedo = useCallback(() => {
    const nextState = historyActions.redo();
    if (nextState) {
      setArrows(nextState.arrows);
      setRects(nextState.rects);
      setTexts(nextState.texts);
      setMosaics(nextState.mosaics);
      // 同步 ref
      arrowsRef.current = nextState.arrows;
      rectsRef.current = nextState.rects;
      textsRef.current = nextState.texts;
      mosaicsRef.current = nextState.mosaics;
      if (nextState.imageData && nextState.imageData !== imageData) {
        setImageData(nextState.imageData);
      }
      setScale(nextState.view.scale);
      setOffset(nextState.view.offset);
      scaleRef.current = nextState.view.scale;
      offsetRef.current = nextState.view.offset;
      setSelectedArrowIds(nextState.selectedArrowIds);
      setSelectedRectIds(nextState.selectedRectIds);
      setSelectedTextIds(nextState.selectedTextIds);
      setSelectedMosaicIds(nextState.selectedMosaicIds);
    }
    updateHistoryButtons();
  }, [historyActions, imageData, updateHistoryButtons]);

  // 将屏幕坐标转换为图片坐标
  const screenToImageCoord = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } | null => {
      const canvas = annotationCanvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left - offsetRef.current.x) / scaleRef.current;
      const y = (clientY - rect.top - offsetRef.current.y) / scaleRef.current;

      return { x, y };
    },
    [],
  );

  // 绘制所有标注（箭头 + 矩形）
  const renderShapes = useCallback(() => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 应用变换
    ctx.save();
    ctx.translate(offsetRef.current.x, offsetRef.current.y);
    ctx.scale(scaleRef.current, scaleRef.current);

    // 绘制已保存的矩形
    rects.forEach((rect) => {
      drawRect(ctx, rect, selectedRectIds.includes(rect.id));
    });

    // 绘制正在绘制的矩形
    if (drawingRect.current && isDrawingRect.current) {
      const { startX, startY, endX, endY } = drawingRect.current;
      const tempRect: RectShape = {
        id: 'temp',
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width: Math.abs(endX - startX),
        height: Math.abs(endY - startY),
        ...rectStyleRef.current,
      };
      drawRect(ctx, tempRect, false);
    }

    // 绘制已保存的箭头
    arrows.forEach((arrow) => {
      drawArrow(ctx, arrow, selectedArrowIds.includes(arrow.id));
    });

    // 绘制正在绘制的箭头
    if (drawingArrow.current && isDrawingArrow.current) {
      const tempArrow: ArrowShape = {
        id: 'temp',
        startX: drawingArrow.current.startX,
        startY: drawingArrow.current.startY,
        endX: drawingArrow.current.endX,
        endY: drawingArrow.current.endY,
        ...arrowStyleRef.current,
      };
      drawArrow(ctx, tempArrow, false);
    }

    // 绘制已保存的文字
    texts.forEach((text) => {
      // 如果正在编辑此文字，则跳过绘制（用 input 替代）
      if (editingTextId === text.id) return;
      drawText(ctx, text, selectedTextIds.includes(text.id));
    });

    // 绘制已保存的马赛克
    mosaics.forEach((mosaic) => {
      drawMosaic(ctx, mosaic, selectedMosaicIds.includes(mosaic.id));
    });

    // 绘制正在绘制的马赛克
    if (drawingMosaic.current && isDrawingMosaic.current) {
      const { startX, startY, endX, endY } = drawingMosaic.current;
      const tempMosaic: MosaicShape = {
        id: 'temp',
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
        width: Math.abs(endX - startX),
        height: Math.abs(endY - startY),
        ...mosaicStyleRef.current,
      };
      drawMosaic(ctx, tempMosaic, false);
    }

    // 绘制裁剪框（裁剪工具激活时）
    if (activeTool === 'crop' && imageDisplaySize) {
      // 如果有确定的裁剪区域，绘制它
      if (cropArea) {
        drawCropBox(ctx, cropArea, imageDisplaySize.width, imageDisplaySize.height);
      }
      // 如果正在绘制裁剪框，绘制临时裁剪框
      if (drawingCrop.current && isDrawingCrop.current) {
        const { startX, startY, endX, endY } = drawingCrop.current;
        const tempCrop: CropArea = {
          x: Math.min(startX, endX),
          y: Math.min(startY, endY),
          width: Math.abs(endX - startX),
          height: Math.abs(endY - startY),
        };
        drawCropBox(ctx, tempCrop, imageDisplaySize.width, imageDisplaySize.height);
      }
    }

    // 绘制框选矩形
    if (isMarqueeSelecting.current && marqueeStart.current && marqueeEnd.current) {
      drawMarqueeRect(ctx, {
        x1: marqueeStart.current.x,
        y1: marqueeStart.current.y,
        x2: marqueeEnd.current.x,
        y2: marqueeEnd.current.y,
      });
    }

    ctx.restore();
  }, [arrows, rects, texts, mosaics, selectedArrowIds, selectedRectIds, selectedTextIds, selectedMosaicIds, editingTextId, cropArea, imageDisplaySize, activeTool]);

  // 更新箭头属性（仅支持单选时使用）
  const updateArrow = useCallback(
    (updates: Partial<ArrowShape>) => {
      if (selectedArrowIds.length !== 1) return;
      const selectedArrowId = selectedArrowIds[0];
      // 修改前保存历史
      pushHistory();
      setArrows((prev) =>
        prev.map((a) =>
          a.id === selectedArrowId ? { ...a, ...updates } : a,
        ),
      );
    },
    [selectedArrowIds, pushHistory],
  );

  // 更新矩形属性（仅支持单选时使用）
  const updateRect = useCallback(
    (updates: Partial<RectShape>) => {
      if (selectedRectIds.length !== 1) return;
      const selectedRectId = selectedRectIds[0];
      // 修改前保存历史
      pushHistory();
      setRects((prev) =>
        prev.map((r) =>
          r.id === selectedRectId ? { ...r, ...updates } : r,
        ),
      );
    },
    [selectedRectIds, pushHistory],
  );

  // 更新文字属性（仅支持单选时使用）
  const updateText = useCallback(
    (updates: Partial<TextShape>) => {
      if (selectedTextIds.length !== 1) return;
      const selectedTextId = selectedTextIds[0];
      // 修改前保存历史
      pushHistory();
      setTexts((prev) =>
        prev.map((t) =>
          t.id === selectedTextId ? { ...t, ...updates } : t,
        ),
      );
    },
    [selectedTextIds, pushHistory],
  );

  // 更新马赛克属性（仅支持单选时使用）
  const updateMosaic = useCallback(
    (updates: Partial<MosaicShape>) => {
      if (selectedMosaicIds.length !== 1) return;
      const selectedMosaicId = selectedMosaicIds[0];
      // 修改前保存历史
      pushHistory();
      setMosaics((prev) =>
        prev.map((m) =>
          m.id === selectedMosaicId ? { ...m, ...updates } : m,
        ),
      );
    },
    [selectedMosaicIds, pushHistory],
  );

  // 选中的箭头（仅支持单选时使用）
  const selectedArrow = useMemo(
    () => selectedArrowIds.length === 1 ? arrows.find((a) => a.id === selectedArrowIds[0]) || null : null,
    [arrows, selectedArrowIds],
  );

  // 选中的矩形（仅支持单选时使用）
  const selectedRect = useMemo(
    () => selectedRectIds.length === 1 ? rects.find((r) => r.id === selectedRectIds[0]) || null : null,
    [rects, selectedRectIds],
  );

  // 选中的文字（仅支持单选时使用）
  const selectedText = useMemo(
    () => selectedTextIds.length === 1 ? texts.find((t) => t.id === selectedTextIds[0]) || null : null,
    [texts, selectedTextIds],
  );

  // 选中的马赛克（仅支持单选时使用）
  const selectedMosaic = useMemo(
    () => selectedMosaicIds.length === 1 ? mosaics.find((m) => m.id === selectedMosaicIds[0]) || null : null,
    [mosaics, selectedMosaicIds],
  );

  // 标注绘制与编辑事件处理
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !imageData) return;

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;

      // 如果正在编辑文字，不处理拖动
      if (editingTextId) return;

      const coord = screenToImageCoord(e.clientX, e.clientY);
      if (!coord) return;

      // 箭头绘制
      if (activeTool === 'arrow') {
        isDrawingArrow.current = true;
        drawingArrow.current = {
          startX: coord.x,
          startY: coord.y,
          endX: coord.x,
          endY: coord.y,
        };
        return;
      }

      // 矩形绘制
      if (activeTool === 'rect') {
        isDrawingRect.current = true;
        drawingRect.current = {
          startX: coord.x,
          startY: coord.y,
          endX: coord.x,
          endY: coord.y,
        };
        return;
      }

      // 文字工具：点击创建文字
      if (activeTool === 'text') {
        const canvas = annotationCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 创建前保存历史
        pushHistory();

        const newText: TextShape = {
          id: generateTextId(),
          x: coord.x,
          y: coord.y,
          text: 'Text',
          ...textStyleRef.current,
        };
        setTexts((prev) => [...prev, newText]);
        setSelectedTextIds([newText.id]);
        setSelectedArrowIds([]);
        setSelectedRectIds([]);
        setSelectedMosaicIds([]);
        // 不自动进入编辑模式，让用户双击编辑
        setActiveTool('select');
        return;
      }

      // 马赛克绘制
      if (activeTool === 'mosaic') {
        isDrawingMosaic.current = true;
        drawingMosaic.current = {
          startX: coord.x,
          startY: coord.y,
          endX: coord.x,
          endY: coord.y,
        };
        return;
      }

      // 裁剪工具
      if (activeTool === 'crop') {
        const currentCrop = cropAreaRef.current;
        const imgSize = imageNaturalSizeRef.current;

        // 如果已有裁剪框，检测是否点击控制点或内部
        if (currentCrop && imgSize) {
          const dragType = getCropDragTypeAtPoint(coord.x, coord.y, currentCrop);
          if (dragType !== 'none') {
            draggingCropRef.current = {
              type: dragType,
              startX: coord.x,
              startY: coord.y,
              cropOrig: {
                x: currentCrop.x,
                y: currentCrop.y,
                width: currentCrop.width,
                height: currentCrop.height,
              },
            };
            return;
          }
        }

        // 否则开始绘制新的裁剪框
        isDrawingCrop.current = true;
        drawingCrop.current = {
          startX: coord.x,
          startY: coord.y,
          endX: coord.x,
          endY: coord.y,
        };
        setCropArea(null); // 清除之前的裁剪框
        return;
      }

      // 选择工具
      if (activeTool === 'select') {
        const currentArrows = arrowsRef.current;
        const currentRects = rectsRef.current;
        const currentTexts = textsRef.current;
        const currentMosaics = mosaicsRef.current;
        const canvas = annotationCanvasRef.current;
        const ctx = canvas?.getContext('2d');

        // 辅助函数：检测对象是否被选中
        const isArrowSelected = (id: string) => selectedArrowIdsRef.current.includes(id);
        const isRectSelected = (id: string) => selectedRectIdsRef.current.includes(id);
        const isTextSelected = (id: string) => selectedTextIdsRef.current.includes(id);
        const isMosaicSelected = (id: string) => selectedMosaicIdsRef.current.includes(id);

        // 辅助函数：检测控制点
        const checkTextControlPoint = (textId: string): { found: boolean; dragType: TextDragType } => {
          const text = currentTexts.find(t => t.id === textId);
          if (text && ctx) {
            const dragType = getTextDragTypeAtPoint(coord.x, coord.y, text, ctx);
            if (dragType !== 'none') {
              return { found: true, dragType };
            }
          }
          return { found: false, dragType: 'none' };
        };

        const checkMosaicControlPoint = (mosaicId: string): { found: boolean; dragType: MosaicDragType } => {
          const mosaic = currentMosaics.find(m => m.id === mosaicId);
          if (mosaic) {
            const dragType = getMosaicDragTypeAtPoint(coord.x, coord.y, mosaic);
            if (dragType !== 'none') {
              return { found: true, dragType };
            }
          }
          return { found: false, dragType: 'none' };
        };

        const checkRectControlPoint = (rectId: string): { found: boolean; dragType: RectDragType } => {
          const rect = currentRects.find(r => r.id === rectId);
          if (rect) {
            const dragType = getRectDragTypeAtPoint(coord.x, coord.y, rect);
            if (dragType !== 'none') {
              return { found: true, dragType };
            }
          }
          return { found: false, dragType: 'none' };
        };

        const checkArrowControlPoint = (arrowId: string): { found: boolean; dragType: DragType } => {
          const arrow = currentArrows.find(a => a.id === arrowId);
          if (arrow) {
            const dragType = getDragTypeAtPoint(coord.x, coord.y, arrow);
            if (dragType !== 'none') {
              return { found: true, dragType };
            }
          }
          return { found: false, dragType: 'none' };
        };

        // 检测已选中对象的控制点（用于拖拽）
        // 遍历所有选中对象，检测控制点
        for (const textId of selectedTextIdsRef.current) {
          const result = checkTextControlPoint(textId);
          if (result.found) {
            // 单独控制点拖拽：只保留当前对象选中
            setSelectedTextIds([textId]);
            setSelectedArrowIds([]);
            setSelectedRectIds([]);
            setSelectedMosaicIds([]);
            draggingTextRef.current = {
              type: result.dragType,
              textId,
              startX: coord.x,
              startY: coord.y,
              textOrig: {
                x: currentTexts.find(t => t.id === textId)!.x,
                y: currentTexts.find(t => t.id === textId)!.y,
                fontSize: currentTexts.find(t => t.id === textId)!.fontSize,
              },
            };
            return;
          }
        }

        for (const mosaicId of selectedMosaicIdsRef.current) {
          const result = checkMosaicControlPoint(mosaicId);
          if (result.found) {
            setSelectedMosaicIds([mosaicId]);
            setSelectedArrowIds([]);
            setSelectedRectIds([]);
            setSelectedTextIds([]);
            draggingMosaicRef.current = {
              type: result.dragType,
              mosaicId,
              startX: coord.x,
              startY: coord.y,
              mosaicOrig: {
                x: currentMosaics.find(m => m.id === mosaicId)!.x,
                y: currentMosaics.find(m => m.id === mosaicId)!.y,
                width: currentMosaics.find(m => m.id === mosaicId)!.width,
                height: currentMosaics.find(m => m.id === mosaicId)!.height,
              },
            };
            return;
          }
        }

        for (const rectId of selectedRectIdsRef.current) {
          const result = checkRectControlPoint(rectId);
          if (result.found) {
            setSelectedRectIds([rectId]);
            setSelectedArrowIds([]);
            setSelectedTextIds([]);
            setSelectedMosaicIds([]);
            draggingRectRef.current = {
              type: result.dragType,
              rectId,
              startX: coord.x,
              startY: coord.y,
              rectOrig: {
                x: currentRects.find(r => r.id === rectId)!.x,
                y: currentRects.find(r => r.id === rectId)!.y,
                width: currentRects.find(r => r.id === rectId)!.width,
                height: currentRects.find(r => r.id === rectId)!.height,
              },
            };
            return;
          }
        }

        for (const arrowId of selectedArrowIdsRef.current) {
          const result = checkArrowControlPoint(arrowId);
          if (result.found) {
            setSelectedArrowIds([arrowId]);
            setSelectedRectIds([]);
            setSelectedTextIds([]);
            setSelectedMosaicIds([]);
            draggingRef.current = {
              type: result.dragType,
              arrowId,
              startX: coord.x,
              startY: coord.y,
              arrowStart: { x: currentArrows.find(a => a.id === arrowId)!.startX, y: currentArrows.find(a => a.id === arrowId)!.startY },
              arrowEnd: { x: currentArrows.find(a => a.id === arrowId)!.endX, y: currentArrows.find(a => a.id === arrowId)!.endY },
            };
            return;
          }
        }

        // 检测是否点击到对象（用于选择）
        // 从后往前遍历，先检测最上层
        if (ctx) {
          for (let i = currentTexts.length - 1; i >= 0; i--) {
            const text = currentTexts[i];
            if (isPointInText(coord.x, coord.y, text, ctx)) {
              if (e.shiftKey) {
                // Shift+点击：切换选中状态
                if (isTextSelected(text.id)) {
                  setSelectedTextIds(prev => prev.filter(id => id !== text.id));
                } else {
                  setSelectedTextIds(prev => [...prev, text.id]);
                }
              } else {
                // 普通点击：单选或开始拖拽
                if (isTextSelected(text.id)) {
                  // 已选中，准备拖拽
                  draggingTextRef.current = {
                    type: 'move',
                    textId: text.id,
                    startX: coord.x,
                    startY: coord.y,
                    textOrig: { x: text.x, y: text.y, fontSize: text.fontSize },
                  };
                } else {
                  // 未选中，单选
                  setSelectedTextIds([text.id]);
                  setSelectedArrowIds([]);
                  setSelectedRectIds([]);
                  setSelectedMosaicIds([]);
                }
              }
              return;
            }
          }
        }

        for (let i = currentMosaics.length - 1; i >= 0; i--) {
          const mosaic = currentMosaics[i];
          if (isPointInMosaic(coord.x, coord.y, mosaic)) {
            if (e.shiftKey) {
              if (isMosaicSelected(mosaic.id)) {
                setSelectedMosaicIds(prev => prev.filter(id => id !== mosaic.id));
              } else {
                setSelectedMosaicIds(prev => [...prev, mosaic.id]);
              }
            } else {
              if (isMosaicSelected(mosaic.id)) {
                draggingMosaicRef.current = {
                  type: 'move',
                  mosaicId: mosaic.id,
                  startX: coord.x,
                  startY: coord.y,
                  mosaicOrig: { x: mosaic.x, y: mosaic.y, width: mosaic.width, height: mosaic.height },
                };
              } else {
                setSelectedMosaicIds([mosaic.id]);
                setSelectedArrowIds([]);
                setSelectedRectIds([]);
                setSelectedTextIds([]);
              }
            }
            return;
          }
        }

        for (let i = currentRects.length - 1; i >= 0; i--) {
          const rect = currentRects[i];
          if (isPointInRect(coord.x, coord.y, rect)) {
            if (e.shiftKey) {
              if (isRectSelected(rect.id)) {
                setSelectedRectIds(prev => prev.filter(id => id !== rect.id));
              } else {
                setSelectedRectIds(prev => [...prev, rect.id]);
              }
            } else {
              if (isRectSelected(rect.id)) {
                draggingRectRef.current = {
                  type: 'move',
                  rectId: rect.id,
                  startX: coord.x,
                  startY: coord.y,
                  rectOrig: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
                };
              } else {
                setSelectedRectIds([rect.id]);
                setSelectedArrowIds([]);
                setSelectedTextIds([]);
                setSelectedMosaicIds([]);
              }
            }
            return;
          }
        }

        for (let i = currentArrows.length - 1; i >= 0; i--) {
          const arrow = currentArrows[i];
          if (isPointNearArrow(coord.x, coord.y, arrow)) {
            if (e.shiftKey) {
              if (isArrowSelected(arrow.id)) {
                setSelectedArrowIds(prev => prev.filter(id => id !== arrow.id));
              } else {
                setSelectedArrowIds(prev => [...prev, arrow.id]);
              }
            } else {
              if (isArrowSelected(arrow.id)) {
                draggingRef.current = {
                  type: 'move',
                  arrowId: arrow.id,
                  startX: coord.x,
                  startY: coord.y,
                  arrowStart: { x: arrow.startX, y: arrow.startY },
                  arrowEnd: { x: arrow.endX, y: arrow.endY },
                };
              } else {
                setSelectedArrowIds([arrow.id]);
                setSelectedRectIds([]);
                setSelectedTextIds([]);
                setSelectedMosaicIds([]);
              }
            }
            return;
          }
        }

        // 点击空白区域，开始框选或清除选中
        // 普通点击空白区域拖拽时开始框选，Shift+框选则添加到已有选择
        isMarqueeSelecting.current = true;
        marqueeStart.current = { x: coord.x, y: coord.y };
        marqueeEnd.current = { x: coord.x, y: coord.y };
      }
    };

    const onMove = (e: MouseEvent) => {
      const coord = screenToImageCoord(e.clientX, e.clientY);
      if (!coord) return;

      // 处理框选
      if (isMarqueeSelecting.current && activeTool === 'select') {
        if (marqueeStart.current) {
          marqueeEnd.current = { x: coord.x, y: coord.y };
          renderShapes();
        }
        return;
      }

      // 处理箭头绘制
      if (isDrawingArrow.current && activeTool === 'arrow') {
        if (!drawingArrow.current) return;
        drawingArrow.current.endX = coord.x;
        drawingArrow.current.endY = coord.y;
        renderShapes();
        return;
      }

      // 处理矩形绘制
      if (isDrawingRect.current && activeTool === 'rect') {
        if (!drawingRect.current) return;
        drawingRect.current.endX = coord.x;
        drawingRect.current.endY = coord.y;
        renderShapes();
        return;
      }

      // 处理矩形拖拽
      if (draggingRectRef.current && activeTool === 'select') {
        const drag = draggingRectRef.current;
        const dx = coord.x - drag.startX;
        const dy = coord.y - drag.startY;
        const orig = drag.rectOrig;

        setRects((prev) =>
          prev.map((r) => {
            if (r.id !== drag.rectId) return r;

            switch (drag.type) {
              case 'move':
                return { ...r, x: orig.x + dx, y: orig.y + dy };
              case 'resize-tl':
                return {
                  ...r,
                  x: orig.x + dx,
                  y: orig.y + dy,
                  width: Math.max(5, orig.width - dx),
                  height: Math.max(5, orig.height - dy),
                };
              case 'resize-tr':
                return {
                  ...r,
                  y: orig.y + dy,
                  width: Math.max(5, orig.width + dx),
                  height: Math.max(5, orig.height - dy),
                };
              case 'resize-bl':
                return {
                  ...r,
                  x: orig.x + dx,
                  width: Math.max(5, orig.width - dx),
                  height: Math.max(5, orig.height + dy),
                };
              case 'resize-br':
                return {
                  ...r,
                  width: Math.max(5, orig.width + dx),
                  height: Math.max(5, orig.height + dy),
                };
              case 'resize-t':
                return { ...r, y: orig.y + dy, height: Math.max(5, orig.height - dy) };
              case 'resize-b':
                return { ...r, height: Math.max(5, orig.height + dy) };
              case 'resize-l':
                return { ...r, x: orig.x + dx, width: Math.max(5, orig.width - dx) };
              case 'resize-r':
                return { ...r, width: Math.max(5, orig.width + dx) };
              default:
                return r;
            }
          }),
        );
        renderShapes();
        return;
      }

      // 处理箭头拖拽
      if (draggingRef.current && activeTool === 'select') {
        const drag = draggingRef.current;
        const dx = coord.x - drag.startX;
        const dy = coord.y - drag.startY;

        setArrows((prev) =>
          prev.map((a) => {
            if (a.id !== drag.arrowId) return a;

            switch (drag.type) {
              case 'move':
              case 'middle':
                // 中点拖拽和整体移动效果相同
                return {
                  ...a,
                  startX: drag.arrowStart.x + dx,
                  startY: drag.arrowStart.y + dy,
                  endX: drag.arrowEnd.x + dx,
                  endY: drag.arrowEnd.y + dy,
                };
              case 'start':
                return { ...a, startX: drag.arrowStart.x + dx, startY: drag.arrowStart.y + dy };
              case 'end':
                return { ...a, endX: drag.arrowEnd.x + dx, endY: drag.arrowEnd.y + dy };
              default:
                return a;
            }
          }),
        );
        renderShapes();
        return;
      }

      // 处理文字拖拽（移动和四角调整字号）
      if (draggingTextRef.current && activeTool === 'select') {
        const drag = draggingTextRef.current;
        const dx = coord.x - drag.startX;
        const dy = coord.y - drag.startY;
        const orig = drag.textOrig;

        setTexts((prev) =>
          prev.map((t) => {
            if (t.id !== drag.textId) return t;

            // 最小字号
            const minFontSize = 8;
            const maxFontSize = 120;

            switch (drag.type) {
              case 'move':
                return { ...t, x: orig.x + dx, y: orig.y + dy };
              // 四角调整字号：控制点跟随鼠标移动
              // 右下角(resize-br): 向右下拖放大，向左上拖缩小
              case 'resize-br': {
                const delta = (dx + dy) / 2;
                const newFontSize = Math.min(maxFontSize, Math.max(minFontSize, orig.fontSize + delta * 0.5));
                return { ...t, fontSize: newFontSize };
              }
              // 左上角(resize-tl): 向左上拖放大，向右下拖缩小
              case 'resize-tl': {
                const delta = (-dx - dy) / 2;
                const newFontSize = Math.min(maxFontSize, Math.max(minFontSize, orig.fontSize + delta * 0.5));
                return { ...t, fontSize: newFontSize, x: orig.x + dx, y: orig.y + dy };
              }
              // 右上角(resize-tr): 向右上拖放大，向左下拖缩小
              case 'resize-tr': {
                const delta = (dx - dy) / 2;
                const newFontSize = Math.min(maxFontSize, Math.max(minFontSize, orig.fontSize + delta * 0.5));
                return { ...t, fontSize: newFontSize, y: orig.y + dy };
              }
              // 左下角(resize-bl): 向左下拖放大，向右上拖缩小
              case 'resize-bl': {
                const delta = (-dx + dy) / 2;
                const newFontSize = Math.min(maxFontSize, Math.max(minFontSize, orig.fontSize + delta * 0.5));
                return { ...t, fontSize: newFontSize, x: orig.x + dx };
              }
              default:
                return t;
            }
          }),
        );
        renderShapes();
        return;
      }

      // 处理马赛克绘制
      if (isDrawingMosaic.current && activeTool === 'mosaic') {
        if (!drawingMosaic.current) return;
        drawingMosaic.current.endX = coord.x;
        drawingMosaic.current.endY = coord.y;
        renderShapes();
        return;
      }

      // 处理马赛克拖拽
      if (draggingMosaicRef.current && activeTool === 'select') {
        const drag = draggingMosaicRef.current;
        const dx = coord.x - drag.startX;
        const dy = coord.y - drag.startY;
        const orig = drag.mosaicOrig;

        setMosaics((prev) =>
          prev.map((m) => {
            if (m.id !== drag.mosaicId) return m;

            switch (drag.type) {
              case 'move':
                return { ...m, x: orig.x + dx, y: orig.y + dy };
              case 'resize-tl':
                return {
                  ...m,
                  x: orig.x + dx,
                  y: orig.y + dy,
                  width: Math.max(5, orig.width - dx),
                  height: Math.max(5, orig.height - dy),
                };
              case 'resize-tr':
                return {
                  ...m,
                  y: orig.y + dy,
                  width: Math.max(5, orig.width + dx),
                  height: Math.max(5, orig.height - dy),
                };
              case 'resize-bl':
                return {
                  ...m,
                  x: orig.x + dx,
                  width: Math.max(5, orig.width - dx),
                  height: Math.max(5, orig.height + dy),
                };
              case 'resize-br':
                return {
                  ...m,
                  width: Math.max(5, orig.width + dx),
                  height: Math.max(5, orig.height + dy),
                };
              case 'resize-t':
                return { ...m, y: orig.y + dy, height: Math.max(5, orig.height - dy) };
              case 'resize-b':
                return { ...m, height: Math.max(5, orig.height + dy) };
              case 'resize-l':
                return { ...m, x: orig.x + dx, width: Math.max(5, orig.width - dx) };
              case 'resize-r':
                return { ...m, width: Math.max(5, orig.width + dx) };
              default:
                return m;
            }
          }),
        );
        renderShapes();
        return;
      }

      // 处理裁剪框绘制
      if (isDrawingCrop.current && activeTool === 'crop') {
        if (!drawingCrop.current) return;
        const imgSize = imageNaturalSizeRef.current;
        if (!imgSize) return;

        // 限制在图片范围内
        drawingCrop.current.endX = Math.max(0, Math.min(imgSize.width, coord.x));
        drawingCrop.current.endY = Math.max(0, Math.min(imgSize.height, coord.y));
        renderShapes();
        return;
      }

      // 处理裁剪框拖拽
      if (draggingCropRef.current && activeTool === 'crop') {
        const drag = draggingCropRef.current;
        const dx = coord.x - drag.startX;
        const dy = coord.y - drag.startY;
        const orig = drag.cropOrig;
        const imgSize = imageNaturalSizeRef.current;
        if (!imgSize) return;

        let newCrop: CropArea;

        switch (drag.type) {
          case 'move':
            newCrop = {
              x: Math.max(0, Math.min(imgSize.width - orig.width, orig.x + dx)),
              y: Math.max(0, Math.min(imgSize.height - orig.height, orig.y + dy)),
              width: orig.width,
              height: orig.height,
            };
            break;
          case 'resize-tl':
            newCrop = {
              x: Math.max(0, orig.x + dx),
              y: Math.max(0, orig.y + dy),
              width: Math.max(MIN_CROP_SIZE, orig.width - dx),
              height: Math.max(MIN_CROP_SIZE, orig.height - dy),
            };
            break;
          case 'resize-tr':
            newCrop = {
              x: orig.x,
              y: Math.max(0, orig.y + dy),
              width: Math.min(imgSize.width - orig.x, Math.max(MIN_CROP_SIZE, orig.width + dx)),
              height: Math.max(MIN_CROP_SIZE, orig.height - dy),
            };
            break;
          case 'resize-bl':
            newCrop = {
              x: Math.max(0, orig.x + dx),
              y: orig.y,
              width: Math.max(MIN_CROP_SIZE, orig.width - dx),
              height: Math.min(imgSize.height - orig.y, Math.max(MIN_CROP_SIZE, orig.height + dy)),
            };
            break;
          case 'resize-br':
            newCrop = {
              x: orig.x,
              y: orig.y,
              width: Math.min(imgSize.width - orig.x, Math.max(MIN_CROP_SIZE, orig.width + dx)),
              height: Math.min(imgSize.height - orig.y, Math.max(MIN_CROP_SIZE, orig.height + dy)),
            };
            break;
          case 'resize-t':
            newCrop = {
              x: orig.x,
              y: Math.max(0, orig.y + dy),
              width: orig.width,
              height: Math.max(MIN_CROP_SIZE, orig.height - dy),
            };
            break;
          case 'resize-b':
            newCrop = {
              x: orig.x,
              y: orig.y,
              width: orig.width,
              height: Math.min(imgSize.height - orig.y, Math.max(MIN_CROP_SIZE, orig.height + dy)),
            };
            break;
          case 'resize-l':
            newCrop = {
              x: Math.max(0, orig.x + dx),
              y: orig.y,
              width: Math.max(MIN_CROP_SIZE, orig.width - dx),
              height: orig.height,
            };
            break;
          case 'resize-r':
            newCrop = {
              x: orig.x,
              y: orig.y,
              width: Math.min(imgSize.width - orig.x, Math.max(MIN_CROP_SIZE, orig.width + dx)),
              height: orig.height,
            };
            break;
          default:
            return;
        }

        setCropArea(newCrop);
        renderShapes();
        return;
      }

      // 更新光标样式
      if (activeTool === 'select') {
        // 如果正在进行框选，显示 crosshair 光标
        if (isMarqueeSelecting.current) {
          el.style.cursor = 'crosshair';
          return;
        }

        const currentRects = rectsRef.current;
        const currentArrows = arrowsRef.current;
        const currentTexts = textsRef.current;
        const currentMosaics = mosaicsRef.current;
        const canvas = annotationCanvasRef.current;
        const ctx = canvas?.getContext('2d');

        // 检测文字光标（已选中对象）
        for (const textId of selectedTextIdsRef.current) {
          const selectedText = currentTexts.find((t) => t.id === textId);
          if (selectedText && ctx) {
            const dragType = getTextDragTypeAtPoint(coord.x, coord.y, selectedText, ctx);
            if (dragType !== 'none') {
              el.style.cursor = TEXT_CURSOR_MAP[dragType];
              return;
            }
          }
        }

        // 检测马赛克光标（已选中对象）
        for (const mosaicId of selectedMosaicIdsRef.current) {
          const selectedMosaic = currentMosaics.find((m) => m.id === mosaicId);
          if (selectedMosaic) {
            const dragType = getMosaicDragTypeAtPoint(coord.x, coord.y, selectedMosaic);
            if (dragType !== 'none') {
              el.style.cursor = MOSAIC_CURSOR_MAP[dragType];
              return;
            }
          }
        }

        // 检测矩形光标（已选中对象）
        for (const rectId of selectedRectIdsRef.current) {
          const selectedRect = currentRects.find((r) => r.id === rectId);
          if (selectedRect) {
            const dragType = getRectDragTypeAtPoint(coord.x, coord.y, selectedRect);
            if (dragType !== 'none') {
              el.style.cursor = RECT_CURSOR_MAP[dragType];
              return;
            }
          }
        }

        // 检测箭头光标（已选中对象）
        for (const arrowId of selectedArrowIdsRef.current) {
          const selectedArrow = currentArrows.find((a) => a.id === arrowId);
          if (selectedArrow) {
            const dragType = getDragTypeAtPoint(coord.x, coord.y, selectedArrow);
            if (dragType !== 'none') {
              // 控制点和移动都使用 move 光标
              el.style.cursor = 'move';
              return;
            }
          }
        }

        // 检测悬停在未选中对象上（显示 pointer 光标）
        if (ctx) {
          // 检测文字
          for (let i = currentTexts.length - 1; i >= 0; i--) {
            const dragType = getTextDragTypeAtPoint(coord.x, coord.y, currentTexts[i], ctx);
            if (dragType !== 'none') {
              el.style.cursor = 'pointer';
              return;
            }
          }
        }

        // 检测马赛克
        for (let i = currentMosaics.length - 1; i >= 0; i--) {
          const dragType = getMosaicDragTypeAtPoint(coord.x, coord.y, currentMosaics[i]);
          if (dragType !== 'none') {
            el.style.cursor = 'pointer';
            return;
          }
        }

        // 检测矩形
        for (let i = currentRects.length - 1; i >= 0; i--) {
          const dragType = getRectDragTypeAtPoint(coord.x, coord.y, currentRects[i]);
          if (dragType !== 'none') {
            el.style.cursor = 'pointer';
            return;
          }
        }

        // 检测箭头
        for (let i = currentArrows.length - 1; i >= 0; i--) {
          const dragType = getDragTypeAtPoint(coord.x, coord.y, currentArrows[i]);
          if (dragType !== 'none') {
            el.style.cursor = 'pointer';
            return;
          }
        }

        el.style.cursor = 'default';
      }

      // 更新裁剪工具光标样式
      if (activeTool === 'crop') {
        const currentCrop = cropAreaRef.current;
        if (currentCrop) {
          const dragType = getCropDragTypeAtPoint(coord.x, coord.y, currentCrop);
          el.style.cursor = CROP_CURSOR_MAP[dragType];
        } else {
          el.style.cursor = 'crosshair';
        }
      }
    };

    const onUp = (e: MouseEvent) => {
      // 结束框选
      if (isMarqueeSelecting.current && marqueeStart.current && marqueeEnd.current) {
        const canvas = annotationCanvasRef.current;
        const ctx = canvas?.getContext('2d');
        const rect = {
          x1: marqueeStart.current.x,
          y1: marqueeStart.current.y,
          x2: marqueeEnd.current.x,
          y2: marqueeEnd.current.y,
        };

        // 计算框选区域尺寸
        const width = Math.abs(rect.x2 - rect.x1);
        const height = Math.abs(rect.y2 - rect.y1);
        const minSelectSize = 5;

        // 如果框选区域太小（只是点击），清除选中
        if (width < minSelectSize && height < minSelectSize) {
          setSelectedArrowIds([]);
          setSelectedRectIds([]);
          setSelectedTextIds([]);
          setSelectedMosaicIds([]);
        } else {
          // 找出框选区域内的所有对象
          const newSelectedArrowIds: string[] = [];
          const newSelectedRectIds: string[] = [];
          const newSelectedTextIds: string[] = [];
          const newSelectedMosaicIds: string[] = [];

          arrowsRef.current.forEach(arrow => {
            if (isArrowInRect(arrow, rect)) {
              newSelectedArrowIds.push(arrow.id);
            }
          });

          rectsRef.current.forEach(rectItem => {
            if (isRectInRect(rectItem, rect)) {
              newSelectedRectIds.push(rectItem.id);
            }
          });

          if (ctx) {
            textsRef.current.forEach(text => {
              if (isTextInRect(text, rect, ctx)) {
                newSelectedTextIds.push(text.id);
              }
            });
          }

          mosaicsRef.current.forEach(mosaic => {
            if (isMosaicInRect(mosaic, rect)) {
              newSelectedMosaicIds.push(mosaic.id);
            }
          });

          // 设置选中状态（替换之前的选择）
          // 如果 Shift 键按下，则添加到已有选择
          if (e.shiftKey) {
            setSelectedArrowIds(prev => [...new Set([...prev, ...newSelectedArrowIds])]);
            setSelectedRectIds(prev => [...new Set([...prev, ...newSelectedRectIds])]);
            setSelectedTextIds(prev => [...new Set([...prev, ...newSelectedTextIds])]);
            setSelectedMosaicIds(prev => [...new Set([...prev, ...newSelectedMosaicIds])]);
          } else {
            setSelectedArrowIds(newSelectedArrowIds);
            setSelectedRectIds(newSelectedRectIds);
            setSelectedTextIds(newSelectedTextIds);
            setSelectedMosaicIds(newSelectedMosaicIds);
          }
        }

        isMarqueeSelecting.current = false;
        marqueeStart.current = null;
        marqueeEnd.current = null;
        renderShapes();
        return;
      }

      // 结束箭头绘制
      if (isDrawingArrow.current && drawingArrow.current) {
        const { startX, startY, endX, endY } = drawingArrow.current;
        const dist = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        const minDrawDist = 5;
        if (dist > minDrawDist) {
          // 创建前保存历史
          pushHistory();
          const newArrow: ArrowShape = {
            id: generateId(),
            startX,
            startY,
            endX,
            endY,
            ...arrowStyleRef.current,
          };
          setArrows((prev) => [...prev, newArrow]);
          setSelectedArrowIds([newArrow.id]);
          setActiveTool('select');
        }
      }
      isDrawingArrow.current = false;
      drawingArrow.current = null;

      // 结束矩形绘制
      if (isDrawingRect.current && drawingRect.current) {
        const { startX, startY, endX, endY } = drawingRect.current;
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);
        const minSize = 5;
        if (width >= minSize && height >= minSize) {
          // 创建前保存历史
          pushHistory();
          const newRect: RectShape = {
            id: generateRectId(),
            x: Math.min(startX, endX),
            y: Math.min(startY, endY),
            width,
            height,
            ...rectStyleRef.current,
          };
          setRects((prev) => [...prev, newRect]);
          setSelectedRectIds([newRect.id]);
          setActiveTool('select');
        }
      }
      isDrawingRect.current = false;
      drawingRect.current = null;

      // 结束马赛克绘制
      if (isDrawingMosaic.current && drawingMosaic.current) {
        const { startX, startY, endX, endY } = drawingMosaic.current;
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);
        const minSize = 5;
        if (width >= minSize && height >= minSize) {
          // 创建前保存历史
          pushHistory();
          const newMosaic: MosaicShape = {
            id: generateMosaicId(),
            x: Math.min(startX, endX),
            y: Math.min(startY, endY),
            width,
            height,
            ...mosaicStyleRef.current,
          };
          setMosaics((prev) => [...prev, newMosaic]);
          setSelectedMosaicIds([newMosaic.id]);
          setActiveTool('select');
        }
      }
      isDrawingMosaic.current = false;
      drawingMosaic.current = null;

      // 结束裁剪框绘制
      if (isDrawingCrop.current && drawingCrop.current) {
        const { startX, startY, endX, endY } = drawingCrop.current;
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);
        // 裁剪框尺寸大于最小值时才创建
        if (width >= MIN_CROP_SIZE && height >= MIN_CROP_SIZE) {
          const newCrop: CropArea = {
            x: Math.min(startX, endX),
            y: Math.min(startY, endY),
            width,
            height,
          };
          setCropArea(newCrop);
        }
      }
      isDrawingCrop.current = false;
      drawingCrop.current = null;

      // 结束拖拽 - 拖拽结束时保存历史
      if (
        draggingRef.current ||
        draggingRectRef.current ||
        draggingTextRef.current ||
        draggingMosaicRef.current
      ) {
        pushHistory();
      }

      // 结束拖拽
      draggingRef.current = null;
      draggingRectRef.current = null;
      draggingTextRef.current = null;
      draggingMosaicRef.current = null;
      draggingCropRef.current = null;

      renderShapes();
    };

    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [activeTool, imageData, selectedArrowIds, selectedRectIds, selectedTextIds, selectedMosaicIds, editingTextId, screenToImageCoord, renderShapes, cropArea, pushHistory]);

  // 标注变化时重新渲染
  useEffect(() => {
    renderShapes();
  }, [arrows, rects, texts, mosaics, selectedArrowIds, selectedRectIds, selectedTextIds, selectedMosaicIds, renderShapes]);

  // 缩放/平移变化时重新渲染
  useEffect(() => {
    renderShapes();
  }, [scale, offset, renderShapes]);

  // Canvas 尺寸调整
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = annotationCanvasRef.current;
      const container = canvasRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      renderShapes();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [renderShapes]);

  // 执行裁剪操作
  const applyCrop = useCallback(() => {
    const currentCropArea = cropAreaRef.current;
    const naturalSize = imageNaturalSizeRef.current;
    const displaySize = imageDisplaySizeRef.current;

    if (!currentCropArea || !imageData || !naturalSize || !displaySize) return;

    // 裁剪前保存历史（包含原始图片和标注）
    pushHistory();

    // 计算显示坐标到原始坐标的缩放比例
    const scaleX = naturalSize.width / displaySize.width;
    const scaleY = naturalSize.height / displaySize.height;

    // 转换为原始图片坐标
    const cropX = Math.round(currentCropArea.x * scaleX);
    const cropY = Math.round(currentCropArea.y * scaleY);
    const cropWidth = Math.round(currentCropArea.width * scaleX);
    const cropHeight = Math.round(currentCropArea.height * scaleY);

    // 创建临时图片来获取原始图片数据
    const img = new window.Image();
    img.onload = () => {
      // 创建临时 Canvas 进行裁剪
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = cropWidth;
      tempCanvas.height = cropHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;

      // 绘制裁剪区域（使用原始坐标）
      tempCtx.drawImage(
        img,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight,
      );

      // 获取裁剪后的图片数据
      const croppedImageData = tempCanvas.toDataURL('image/png');

      // 更新图片数据
      setImageData(croppedImageData);

      // 清除所有标注
      setArrows([]);
      setRects([]);
      setTexts([]);
      setMosaics([]);

      // 清除选中状态
      setSelectedArrowIds([]);
      setSelectedRectIds([]);
      setSelectedTextIds([]);
      setSelectedMosaicIds([]);

      // 清除裁剪状态
      setCropArea(null);
      setImageNaturalSize({ width: cropWidth, height: cropHeight });
      setImageDisplaySize(null);

      // 切换到选择工具
      setActiveTool('select');

      // 重置视图
      scaleRef.current = 1;
      offsetRef.current = { x: 0, y: 0 };
      setScale(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageData;
  }, [imageData, pushHistory]);

  // 取消裁剪操作
  const cancelCrop = useCallback(() => {
    setCropArea(null);
    setActiveTool('select');
  }, []);

  // Delete 键删除选中的箭头、矩形或文字 / Ctrl+Z 撤销 / Ctrl+Shift+Z 重做 / Ctrl+A 全选 / Escape 取消选择
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 撤销快捷键：Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        // 避免在输入框中触发
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }
        e.preventDefault();
        handleUndo();
        return;
      }

      // 重做快捷键：Ctrl+Shift+Z / Cmd+Shift+Z 或 Ctrl+Y / Cmd+Y
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        // 避免在输入框中触发
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }
        e.preventDefault();
        handleRedo();
        return;
      }

      // 全选快捷键：Ctrl+A / Cmd+A
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        // 避免在输入框中触发
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }
        e.preventDefault();
        // 选中所有对象
        setSelectedArrowIds(arrowsRef.current.map(a => a.id));
        setSelectedRectIds(rectsRef.current.map(r => r.id));
        setSelectedTextIds(textsRef.current.map(t => t.id));
        setSelectedMosaicIds(mosaicsRef.current.map(m => m.id));
        return;
      }

      // Escape 取消选择或取消框选
      if (e.key === 'Escape') {
        // 避免在输入框中触发
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }
        // 如果正在框选，取消框选
        if (isMarqueeSelecting.current) {
          isMarqueeSelecting.current = false;
          marqueeStart.current = null;
          marqueeEnd.current = null;
          renderShapes();
          return;
        }
        // 否则取消所有选择
        setSelectedArrowIds([]);
        setSelectedRectIds([]);
        setSelectedTextIds([]);
        setSelectedMosaicIds([]);
        return;
      }

      // 裁剪工具快捷键
      if (activeTool === 'crop') {
        if (e.key === 'Enter' && cropArea) {
          e.preventDefault();
          applyCrop();
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          cancelCrop();
          return;
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        // 避免在输入框中触发
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }

        // 删除前保存历史
        const hasSelection =
          selectedArrowIds.length > 0 || selectedRectIds.length > 0 ||
          selectedTextIds.length > 0 || selectedMosaicIds.length > 0;
        if (hasSelection) {
          pushHistory();
        }

        // 批量删除选中的箭头
        if (selectedArrowIds.length > 0) {
          setArrows((prev) => prev.filter((a) => !selectedArrowIds.includes(a.id)));
          setSelectedArrowIds([]);
        }

        // 批量删除选中的矩形
        if (selectedRectIds.length > 0) {
          setRects((prev) => prev.filter((r) => !selectedRectIds.includes(r.id)));
          setSelectedRectIds([]);
        }

        // 批量删除选中的文字
        if (selectedTextIds.length > 0) {
          setTexts((prev) => prev.filter((t) => !selectedTextIds.includes(t.id)));
          setSelectedTextIds([]);
        }

        // 批量删除选中的马赛克
        if (selectedMosaicIds.length > 0) {
          setMosaics((prev) => prev.filter((m) => !selectedMosaicIds.includes(m.id)));
          setSelectedMosaicIds([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArrowIds, selectedRectIds, selectedTextIds, selectedMosaicIds, activeTool, cropArea, applyCrop, cancelCrop, handleUndo, handleRedo, pushHistory, renderShapes]);

  // 双击文字进入编辑模式 / 双击确认裁剪
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !imageData) return;

    const onDoubleClick = (e: MouseEvent) => {
      const coord = screenToImageCoord(e.clientX, e.clientY);
      if (!coord) return;

      // 裁剪工具：双击确认裁剪
      if (activeTool === 'crop' && cropArea) {
        if (isPointInCrop(coord.x, coord.y, cropArea)) {
          applyCrop();
          return;
        }
      }

      if (activeTool !== 'select') return;

      const canvas = annotationCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 检测是否双击到文字
      const currentTexts = textsRef.current;
      for (let i = currentTexts.length - 1; i >= 0; i--) {
        const text = currentTexts[i];
        if (isPointInText(coord.x, coord.y, text, ctx)) {
          setEditingTextId(text.id);
          setEditingTextValue(text.text);
          setSelectedTextIds([text.id]);
          // 聚焦输入框
          setTimeout(() => {
            textInputRef.current?.focus();
            textInputRef.current?.select();
          }, 0);
          return;
        }
      }
    };

    el.addEventListener('dblclick', onDoubleClick);
    return () => el.removeEventListener('dblclick', onDoubleClick);
  }, [activeTool, imageData, screenToImageCoord, cropArea, applyCrop]);

  // 工具切换时处理裁剪状态
  useEffect(() => {
    if (activeTool !== 'crop') {
      // 切换到其他工具时，清除裁剪状态
      if (cropArea) {
        setCropArea(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool]);

  // 锚点缩放
  const zoomAt = useCallback(
    (newScale: number, anchorX: number, anchorY: number) => {
      const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
      const oldScale = scaleRef.current;
      const ratio = clamped / oldScale;
      const old = offsetRef.current;
      const newOffset = {
        x: anchorX * (1 - ratio) + old.x * ratio,
        y: anchorY * (1 - ratio) + old.y * ratio,
      };
      scaleRef.current = clamped;
      offsetRef.current = newOffset;
      setScale(clamped);
      setOffset(newOffset);
    },
    [],
  );

  // 鼠标滚轮缩放
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      zoomAt(
        scaleRef.current * factor,
        rect.width / 2,
        rect.height / 2,
      );
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [zoomAt]);

  // 画布拖拽平移
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffsetStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0 || !imageData || activeTool !== 'move') return;
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      panOffsetStart.current = offsetRef.current;
      el.style.cursor = 'grabbing';
    };

    const onMove = (e: MouseEvent) => {
      if (!isPanning.current) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      const newOffset = {
        x: panOffsetStart.current.x + dx,
        y: panOffsetStart.current.y + dy,
      };
      offsetRef.current = newOffset;
      setOffset(newOffset);
    };

    const onUp = () => {
      isPanning.current = false;
      if (activeTool === 'move') {
        el.style.cursor = 'grab';
      }
    };

    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [activeTool, imageData]);

  // 缩放控制
  const zoomIn = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    zoomAt(scaleRef.current * 1.2, rect.width / 2, rect.height / 2);
  }, [zoomAt]);

  const zoomOut = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    zoomAt(scaleRef.current / 1.2, rect.width / 2, rect.height / 2);
  }, [zoomAt]);

  const resetView = useCallback(() => {
    scaleRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const handleSlider = useCallback(
    (newScale: number) => {
      const el = canvasRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      zoomAt(newScale, rect.width / 2, rect.height / 2);
    },
    [zoomAt],
  );

  const zoomPercent = Math.round(scale * 100);

  // 解析 URL 参数
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const src = parseSource();
    setSource(src);

    if (src === 'capture') {
      // 带图模式：从 storage 读取截图
      chrome.storage.local.get(STORAGE_KEYS.CAPTURE_RESULT, (result) => {
        const data = result[STORAGE_KEYS.CAPTURE_RESULT] as {
          success: boolean;
          imageData?: string;
          error?: string;
        } | undefined;
        if (data?.success && data.imageData) {
          setImageData(data.imageData);
        } else if (data?.error) {
          setError(data.error);
        } else {
          setError('未找到截图数据');
        }
      });
    }
  }, []);

  // 空画布模式全局粘贴监听
  useEffect(() => {
    if (source !== 'upload') return;

    const handlePaste = (e: Event) => {
      const clipboardEvent = e as unknown as ClipboardEvent;
      const items = clipboardEvent.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (!file) return;
          readFileAsDataUrl(file).then((dataUrl) => {
            setImageData(dataUrl);
          });
          return;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [source]);

  // 图片加载后初始化/重置历史
  const imageLoadedRef = useRef(false);
  useEffect(() => {
    if (imageData && !imageLoadedRef.current) {
      imageLoadedRef.current = true;
      // 重置历史状态
      historyActions.resetToState({
        arrows: [],
        rects: [],
        texts: [],
        mosaics: [],
        imageData,
        view: { scale: 1, offset: { x: 0, y: 0 } },
        selectedArrowIds: [],
        selectedRectIds: [],
        selectedTextIds: [],
        selectedMosaicIds: [],
      });
      updateHistoryButtons();
    }
  }, [imageData, historyActions, updateHistoryButtons]);

  const handleImageLoad = useCallback((dataUrl: string) => {
    setImageData(dataUrl);
    setError(null);
    // 新图片加载时重置历史初始化标记
    imageLoadedRef.current = false;
  }, []);

  const showPlaceholder = source === 'upload' && !imageData && !error;

  return (
    <div className="editor-container w-screen h-screen flex overflow-hidden">
      {/* 左侧工具栏 */}
      <Toolbar
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* 中央画布 */}
      <main
        ref={canvasRef}
        className="editor-canvas flex-1 h-full relative overflow-hidden"
        style={{
          cursor:
            activeTool === 'move'
              ? 'grab'
              : activeTool === 'arrow' || activeTool === 'rect' || activeTool === 'text' || activeTool === 'mosaic' || activeTool === 'crop'
                ? 'crosshair'
                : 'default',
        }}
      >
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[13px] text-[var(--color-editor-error)] font-body mb-1">
                // capture error
              </p>
              <p className="text-[11px] text-[var(--color-editor-hint)] font-body">
                {error}
              </p>
            </div>
          </div>
        ) : imageData ? (
          <>
            {/* Transform Layer */}
            <div
              ref={imageContainerRef}
              className="absolute inset-0"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: '0 0',
              }}
            >
              <CanvasImage src={imageData} onSizeChange={handleImageSizeChange} onNaturalSizeChange={handleImageNaturalSizeChange} />
            </div>

            {/* Annotation Canvas Layer */}
            <canvas
              ref={annotationCanvasRef}
              className="absolute inset-0 pointer-events-none"
              style={{ pointerEvents: 'auto' }}
            />

            {/* 文字编辑输入框 */}
            {editingTextId && (() => {
              const editingText = texts.find(t => t.id === editingTextId);
              if (!editingText) return null;
              
              // 计算相对于容器的位置：文字坐标 * scale + offset
              const containerX = editingText.x * scale + offset.x;
              const containerY = editingText.y * scale + offset.y;
              
              return (
                <input
                  ref={textInputRef}
                  type="text"
                  value={editingTextValue}
                  onChange={(e) => setEditingTextValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // 确认编辑
                      if (editingTextId && editingTextValue.trim()) {
                        setTexts((prev) =>
                          prev.map((t) =>
                            t.id === editingTextId ? { ...t, text: editingTextValue } : t,
                          ),
                        );
                      }
                      setEditingTextId(null);
                      setEditingTextValue('');
                    } else if (e.key === 'Escape') {
                      // 取消编辑
                      setEditingTextId(null);
                      setEditingTextValue('');
                    }
                  }}
                  onBlur={() => {
                    // 失去焦点时保存
                    if (editingTextId && editingTextValue.trim()) {
                      setTexts((prev) =>
                        prev.map((t) =>
                          t.id === editingTextId ? { ...t, text: editingTextValue } : t,
                        ),
                      );
                    }
                    setEditingTextId(null);
                    setEditingTextValue('');
                  }}
                  style={{
                    position: 'absolute',
                    left: containerX,
                    top: containerY,
                    fontSize: editingText.fontSize * scale,
                    fontWeight: editingText.fontWeight,
                    fontStyle: editingText.fontStyle,
                    color: editingText.color,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    minWidth: 50,
                    fontFamily: 'sans-serif',
                    padding: 0,
                    margin: 0,
                    zIndex: 1000,
                  }}
                />
              );
            })()}

            {/* 裁剪操作提示 */}
            {activeTool === 'crop' && (
              <div
                className="absolute top-4 left-1/2 flex items-center gap-3 rounded-lg px-4 py-2"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.75)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  transform: 'translateX(-50%)',
                }}
              >
                <span className="text-[12px] text-white">
                  {cropArea ? '拖拽调整裁剪区域，' : '拖拽绘制裁剪区域，'}
                </span>
                <span className="text-[12px] text-emerald-400">
                  Enter
                </span>
                <span className="text-[12px] text-white">确认</span>
                <span className="text-[12px] text-gray-400 mx-1">|</span>
                <span className="text-[12px] text-amber-400">
                  Esc
                </span>
                <span className="text-[12px] text-white">取消</span>
              </div>
            )}

            {/* 缩放控制条 */}
            <div
              className="absolute bottom-4 left-1/2 h-8 flex items-center gap-2 rounded-lg px-2"
              style={{
                backgroundColor: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(0,0,0,0.1)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                transform: 'translateX(-50%)',
              }}
            >
              <button
                onClick={zoomOut}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5"
              >
                <Minus size={14} />
              </button>
              <span
                className="text-[12px] w-10 text-center tabular-nums"
                style={{ color: '#333' }}
              >
                {zoomPercent}%
              </span>
              <input
                type="range"
                min={MIN_SCALE}
                max={MAX_SCALE}
                step={0.01}
                value={scale}
                onChange={(e) =>
                  handleSlider(parseFloat(e.target.value))
                }
                className="w-20 accent-emerald-500"
              />
              <button
                onClick={zoomIn}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5"
              >
                <Plus size={14} />
              </button>
              <div className="w-px h-4 bg-gray-300" />
              <button
                onClick={resetView}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/5"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </>
        ) : showPlaceholder ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <UploadPlaceholder onImageLoad={handleImageLoad} />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[13px] text-[var(--color-editor-comment)] font-body">
              // editor_canvas
            </p>
          </div>
        )}
      </main>

      {/* 右侧属性面板 */}
      <PropertiesPanel
        selectedArrow={selectedArrow}
        onUpdateArrow={updateArrow}
        selectedRect={selectedRect}
        onUpdateRect={updateRect}
        selectedText={selectedText}
        onUpdateText={updateText}
        selectedMosaic={selectedMosaic}
        onUpdateMosaic={updateMosaic}
        frameSettings={frameSettings}
        onUpdateFrameSettings={(updates) =>
          setFrameSettings((prev) => ({ ...prev, ...updates }))
        }
      />
    </div>
  );
};

export default App;
