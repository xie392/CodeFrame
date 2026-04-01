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

type EditorSource = 'capture' | 'upload';
type ToolId = 'select' | 'move' | 'arrow' | 'rect' | 'text' | 'mosaic' | 'crop';
type ArrowStyle = 'single' | 'double';
type RectBorderStyle = 'solid' | 'dashed';

interface ToolConfig {
  id: ToolId;
  icon: React.ReactNode;
}

// 箭头数据结构
interface ArrowShape {
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
interface RectShape {
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
interface TextShape {
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
interface MosaicShape {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  blockSize: number;
  opacity: number; // 0-100
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

// 箭头拖拽类型
type DragType = 'none' | 'move' | 'start' | 'end';

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

  // 检测终点控制点
  const distEnd = Math.sqrt((x - endX) ** 2 + (y - endY) ** 2);
  if (distEnd <= threshold) return 'end';

  // 检测起点控制点
  const distStart = Math.sqrt((x - startX) ** 2 + (y - startY) ** 2);
  if (distStart <= threshold) return 'start';

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
// 子组件
// ---------------------------------------------------------------------------

/** 左侧工具栏 */
const Toolbar: React.FC<{
  activeTool: ToolId;
  onSelectTool: (tool: ToolId) => void;
}> = ({ activeTool, onSelectTool }) => (
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
    <button className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center tool-btn cursor-not-allowed opacity-40">
      <Undo2 size={18} />
    </button>
    <button className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center tool-btn cursor-not-allowed opacity-40">
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
}> = ({ selectedArrow, onUpdateArrow, selectedRect, onUpdateRect, selectedText, onUpdateText, selectedMosaic, onUpdateMosaic }) => {
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
      <span className="text-[12px] text-[var(--color-editor-comment)] font-body">
        // properties
      </span>

      {/* [position] 区域 */}
      <div className="flex flex-col gap-[10px]">
        <span
          className="text-[11px] font-body font-semibold"
          style={{ color: 'var(--color-accent-orange)' }}
        >
          [position]
        </span>
        {selectionType === 'arrow' && selectedArrow ? (
          <>
            <div className="flex gap-2">
              <EditableField
                label="x1"
                value={selectedArrow.startX}
                onChange={(val) => onUpdateArrow({ startX: val })}
              />
              <EditableField
                label="y1"
                value={selectedArrow.startY}
                onChange={(val) => onUpdateArrow({ startY: val })}
              />
            </div>
            <div className="flex gap-2">
              <EditableField
                label="x2"
                value={selectedArrow.endX}
                onChange={(val) => onUpdateArrow({ endX: val })}
              />
              <EditableField
                label="y2"
                value={selectedArrow.endY}
                onChange={(val) => onUpdateArrow({ endY: val })}
              />
            </div>
          </>
        ) : selectionType === 'rect' && selectedRect ? (
          <>
            <div className="flex gap-2">
              <EditableField
                label="x"
                value={selectedRect.x}
                onChange={(val) => onUpdateRect({ x: val })}
              />
              <EditableField
                label="y"
                value={selectedRect.y}
                onChange={(val) => onUpdateRect({ y: val })}
              />
            </div>
            <div className="flex gap-2">
              <EditableField
                label="w"
                value={selectedRect.width}
                onChange={(val) => onUpdateRect({ width: val })}
              />
              <EditableField
                label="h"
                value={selectedRect.height}
                onChange={(val) => onUpdateRect({ height: val })}
              />
            </div>
          </>
        ) : selectionType === 'text' && selectedText ? (
          <>
            <div className="flex gap-2">
              <EditableField
                label="x"
                value={selectedText.x}
                onChange={(val) => onUpdateText({ x: val })}
              />
              <EditableField
                label="y"
                value={selectedText.y}
                onChange={(val) => onUpdateText({ y: val })}
              />
            </div>
          </>
        ) : selectionType === 'mosaic' && selectedMosaic ? (
          <>
            <div className="flex gap-2">
              <EditableField
                label="x"
                value={selectedMosaic.x}
                onChange={(val) => onUpdateMosaic({ x: val })}
              />
              <EditableField
                label="y"
                value={selectedMosaic.y}
                onChange={(val) => onUpdateMosaic({ y: val })}
              />
            </div>
            <div className="flex gap-2">
              <EditableField
                label="w"
                value={selectedMosaic.width}
                onChange={(val) => onUpdateMosaic({ width: val })}
              />
              <EditableField
                label="h"
                value={selectedMosaic.height}
                onChange={(val) => onUpdateMosaic({ height: val })}
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <PropField label="x" value="0" />
              <PropField label="y" value="0" />
            </div>
            <div className="flex gap-2">
              <PropField label="w" value="0" />
              <PropField label="h" value="0" />
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
            [arrow_style]
          </span>
          <ColorPicker
            color={selectedArrow.color}
            onChange={handleArrowColorChange}
          />
          <SliderControl
            label="stroke"
            value={selectedArrow.strokeWidth}
            min={1}
            max={10}
            onChange={handleArrowStrokeWidthChange}
          />
          <SliderControl
            label="head"
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
            [rect_style]
          </span>
          <ColorPicker
            color={selectedRect.color}
            onChange={handleRectColorChange}
          />
          <SliderControl
            label="stroke"
            value={selectedRect.strokeWidth}
            min={1}
            max={10}
            onChange={handleRectStrokeWidthChange}
          />
          <SliderControl
            label="fill"
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
            [text_style]
          </span>
          <ColorPicker
            color={selectedText.color}
            onChange={handleTextColorChange}
          />
          <SliderControl
            label="size"
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
            [mosaic_style]
          </span>
          <SliderControl
            label="block"
            value={selectedMosaic.blockSize}
            min={5}
            max={50}
            onChange={handleBlockSizeChange}
          />
          <SliderControl
            label="opacity"
            value={selectedMosaic.opacity}
            min={0}
            max={100}
            unit="%"
            onChange={handleMosaicOpacityChange}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-[10px]">
          <span
            className="text-[11px] font-body font-semibold"
            style={{ color: 'var(--color-accent-orange)' }}
          >
            [style]
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
              stroke:
            </span>
            <div
              className="w-[20px] h-[20px] rounded-[4px] shrink-0"
              style={{ backgroundColor: '#00D4AA' }}
            />
            <span className="text-[11px] text-foreground font-body leading-none">
              #00D4AA
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
              width:
            </span>
            <div className="prop-field-sm h-[28px] w-[60px] rounded-[6px] px-2 flex items-center">
              <span className="text-[11px] text-foreground font-body leading-none">
                2px
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex flex-col gap-2 mt-auto">
        <button className="export-btn w-full h-[40px] rounded-[12px] flex items-center justify-center gap-2 cursor-pointer">
          <Download size={16} style={{ color: '#0D0D0D' }} />
          <span
            className="text-[12px] font-body font-semibold leading-none"
            style={{ color: '#0D0D0D' }}
          >
            $ export_image
          </span>
        </button>
        <button className="copy-btn w-full h-[40px] rounded-[12px] flex items-center justify-center gap-2 cursor-pointer">
          <ClipboardCopy size={16} className="text-[var(--color-editor-hint)]" />
          <span className="text-[12px] font-body font-semibold leading-none text-[var(--color-editor-hint)]">
            $ copy_to_clipboard
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
}> = ({ src, onSizeChange }) => {
  return (
    <img
      src={src}
      alt="编辑图片"
      onLoad={(e) => {
        const img = e.currentTarget;
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
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

  // 画布缩放/平移状态
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(scale);
  const offsetRef = useRef(offset);

  // 图片加载后计算居中偏移
  const handleImageSizeChange = useCallback(
    (w: number, h: number) => {
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

  // 箭头相关状态
  const [arrows, setArrows] = useState<ArrowShape[]>([]);
  const [selectedArrowId, setSelectedArrowId] = useState<string | null>(null);
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
  const [selectedRectId, setSelectedRectId] = useState<string | null>(null);
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
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
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
  const [selectedMosaicId, setSelectedMosaicId] = useState<string | null>(null);
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
  const selectedArrowIdRef = useRef(selectedArrowId);
  selectedArrowIdRef.current = selectedArrowId;

  const selectedRectIdRef = useRef(selectedRectId);
  selectedRectIdRef.current = selectedRectId;

  const selectedTextIdRef = useRef(selectedTextId);
  selectedTextIdRef.current = selectedTextId;

  const selectedMosaicIdRef = useRef(selectedMosaicId);
  selectedMosaicIdRef.current = selectedMosaicId;

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
      drawRect(ctx, rect, rect.id === selectedRectId);
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
      drawArrow(ctx, arrow, arrow.id === selectedArrowId);
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
      drawText(ctx, text, text.id === selectedTextId);
    });

    // 绘制已保存的马赛克
    mosaics.forEach((mosaic) => {
      drawMosaic(ctx, mosaic, mosaic.id === selectedMosaicId);
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

    ctx.restore();
  }, [arrows, rects, texts, mosaics, selectedArrowId, selectedRectId, selectedTextId, selectedMosaicId, editingTextId]);

  // 更新箭头属性
  const updateArrow = useCallback(
    (updates: Partial<ArrowShape>) => {
      if (!selectedArrowId) return;
      setArrows((prev) =>
        prev.map((a) =>
          a.id === selectedArrowId ? { ...a, ...updates } : a,
        ),
      );
    },
    [selectedArrowId],
  );

  // 更新矩形属性
  const updateRect = useCallback(
    (updates: Partial<RectShape>) => {
      if (!selectedRectId) return;
      setRects((prev) =>
        prev.map((r) =>
          r.id === selectedRectId ? { ...r, ...updates } : r,
        ),
      );
    },
    [selectedRectId],
  );

  // 更新文字属性
  const updateText = useCallback(
    (updates: Partial<TextShape>) => {
      if (!selectedTextId) return;
      setTexts((prev) =>
        prev.map((t) =>
          t.id === selectedTextId ? { ...t, ...updates } : t,
        ),
      );
    },
    [selectedTextId],
  );

  // 更新马赛克属性
  const updateMosaic = useCallback(
    (updates: Partial<MosaicShape>) => {
      if (!selectedMosaicId) return;
      setMosaics((prev) =>
        prev.map((m) =>
          m.id === selectedMosaicId ? { ...m, ...updates } : m,
        ),
      );
    },
    [selectedMosaicId],
  );

  // 选中的箭头
  const selectedArrow = useMemo(
    () => arrows.find((a) => a.id === selectedArrowId) || null,
    [arrows, selectedArrowId],
  );

  // 选中的矩形
  const selectedRect = useMemo(
    () => rects.find((r) => r.id === selectedRectId) || null,
    [rects, selectedRectId],
  );

  // 选中的文字
  const selectedText = useMemo(
    () => texts.find((t) => t.id === selectedTextId) || null,
    [texts, selectedTextId],
  );

  // 选中的马赛克
  const selectedMosaic = useMemo(
    () => mosaics.find((m) => m.id === selectedMosaicId) || null,
    [mosaics, selectedMosaicId],
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

        const newText: TextShape = {
          id: generateTextId(),
          x: coord.x,
          y: coord.y,
          text: 'Text',
          ...textStyleRef.current,
        };
        setTexts((prev) => [...prev, newText]);
        setSelectedTextId(newText.id);
        setSelectedArrowId(null);
        setSelectedRectId(null);
        setSelectedMosaicId(null);
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

      // 选择工具
      if (activeTool === 'select') {
        const currentArrows = arrowsRef.current;
        const currentRects = rectsRef.current;
        const currentTexts = textsRef.current;
        const canvas = annotationCanvasRef.current;
        const ctx = canvas?.getContext('2d');

        // 如果已选中文字，优先检测文字控制点
        if (selectedTextId && ctx) {
          const selectedText = currentTexts.find((t) => t.id === selectedTextId);
          if (selectedText) {
            const dragType = getTextDragTypeAtPoint(coord.x, coord.y, selectedText, ctx);
            if (dragType !== 'none') {
              setSelectedArrowId(null); // 清除箭头选中
              setSelectedRectId(null); // 清除矩形选中
              setSelectedMosaicId(null); // 清除马赛克选中
              draggingTextRef.current = {
                type: dragType,
                textId: selectedTextId,
                startX: coord.x,
                startY: coord.y,
                textOrig: {
                  x: selectedText.x,
                  y: selectedText.y,
                  fontSize: selectedText.fontSize,
                },
              };
              return;
            }
          }
        }

        // 如果已选中马赛克，优先检测马赛克控制点
        const currentMosaics = mosaicsRef.current;
        if (selectedMosaicId) {
          const selectedMosaic = currentMosaics.find((m) => m.id === selectedMosaicId);
          if (selectedMosaic) {
            const dragType = getMosaicDragTypeAtPoint(coord.x, coord.y, selectedMosaic);
            if (dragType !== 'none') {
              setSelectedArrowId(null); // 清除箭头选中
              setSelectedTextId(null); // 清除文字选中
              setSelectedRectId(null); // 清除矩形选中
              draggingMosaicRef.current = {
                type: dragType,
                mosaicId: selectedMosaicId,
                startX: coord.x,
                startY: coord.y,
                mosaicOrig: {
                  x: selectedMosaic.x,
                  y: selectedMosaic.y,
                  width: selectedMosaic.width,
                  height: selectedMosaic.height,
                },
              };
              return;
            }
          }
        }

        // 如果已选中矩形，优先检测矩形控制点
        if (selectedRectId) {
          const selectedRect = currentRects.find((r) => r.id === selectedRectId);
          if (selectedRect) {
            const dragType = getRectDragTypeAtPoint(coord.x, coord.y, selectedRect);
            if (dragType !== 'none') {
              setSelectedArrowId(null); // 清除箭头选中
              setSelectedTextId(null); // 清除文字选中
              setSelectedMosaicId(null); // 清除马赛克选中
              draggingRectRef.current = {
                type: dragType,
                rectId: selectedRectId,
                startX: coord.x,
                startY: coord.y,
                rectOrig: {
                  x: selectedRect.x,
                  y: selectedRect.y,
                  width: selectedRect.width,
                  height: selectedRect.height,
                },
              };
              return;
            }
          }
        }

        // 如果已选中箭头，检测箭头控制点
        if (selectedArrowId) {
          const selectedArrow = currentArrows.find((a) => a.id === selectedArrowId);
          if (selectedArrow) {
            const dragType = getDragTypeAtPoint(coord.x, coord.y, selectedArrow);
            if (dragType !== 'none') {
              setSelectedRectId(null); // 清除矩形选中
              setSelectedTextId(null); // 清除文字选中
              setSelectedMosaicId(null); // 清除马赛克选中
              draggingRef.current = {
                type: dragType,
                arrowId: selectedArrowId,
                startX: coord.x,
                startY: coord.y,
                arrowStart: { x: selectedArrow.startX, y: selectedArrow.startY },
                arrowEnd: { x: selectedArrow.endX, y: selectedArrow.endY },
              };
              return;
            }
          }
        }

        // 检测是否点击到文字（从后往前遍历，先检测最上层）
        if (ctx) {
          for (let i = currentTexts.length - 1; i >= 0; i--) {
            const dragType = getTextDragTypeAtPoint(coord.x, coord.y, currentTexts[i], ctx);
            if (dragType !== 'none') {
              setSelectedTextId(currentTexts[i].id);
              setSelectedArrowId(null);
              setSelectedRectId(null);
              setSelectedMosaicId(null);
              draggingTextRef.current = {
                type: dragType,
                textId: currentTexts[i].id,
                startX: coord.x,
                startY: coord.y,
                textOrig: {
                  x: currentTexts[i].x,
                  y: currentTexts[i].y,
                  fontSize: currentTexts[i].fontSize,
                },
              };
              return;
            }
          }
        }

        // 检测是否点击到马赛克（从后往前遍历，先检测最上层）
        for (let i = currentMosaics.length - 1; i >= 0; i--) {
          const dragType = getMosaicDragTypeAtPoint(coord.x, coord.y, currentMosaics[i]);
          if (dragType !== 'none') {
            setSelectedMosaicId(currentMosaics[i].id);
            setSelectedArrowId(null);
            setSelectedRectId(null);
            setSelectedTextId(null);
            draggingMosaicRef.current = {
              type: dragType,
              mosaicId: currentMosaics[i].id,
              startX: coord.x,
              startY: coord.y,
              mosaicOrig: {
                x: currentMosaics[i].x,
                y: currentMosaics[i].y,
                width: currentMosaics[i].width,
                height: currentMosaics[i].height,
              },
            };
            return;
          }
        }

        // 检测是否点击到矩形（从后往前遍历，先检测最上层）
        for (let i = currentRects.length - 1; i >= 0; i--) {
          const dragType = getRectDragTypeAtPoint(coord.x, coord.y, currentRects[i]);
          if (dragType !== 'none') {
            setSelectedRectId(currentRects[i].id);
            setSelectedArrowId(null);
            setSelectedTextId(null);
            setSelectedMosaicId(null);
            draggingRectRef.current = {
              type: dragType,
              rectId: currentRects[i].id,
              startX: coord.x,
              startY: coord.y,
              rectOrig: {
                x: currentRects[i].x,
                y: currentRects[i].y,
                width: currentRects[i].width,
                height: currentRects[i].height,
              },
            };
            return;
          }
        }

        // 检测是否点击到箭头
        for (let i = currentArrows.length - 1; i >= 0; i--) {
          const dragType = getDragTypeAtPoint(coord.x, coord.y, currentArrows[i]);
          if (dragType !== 'none') {
            setSelectedArrowId(currentArrows[i].id);
            setSelectedRectId(null);
            setSelectedTextId(null);
            setSelectedMosaicId(null);
            draggingRef.current = {
              type: dragType,
              arrowId: currentArrows[i].id,
              startX: coord.x,
              startY: coord.y,
              arrowStart: { x: currentArrows[i].startX, y: currentArrows[i].startY },
              arrowEnd: { x: currentArrows[i].endX, y: currentArrows[i].endY },
            };
            return;
          }
        }

        // 点击空白区域，清除选中
        setSelectedArrowId(null);
        setSelectedRectId(null);
        setSelectedTextId(null);
        setSelectedMosaicId(null);
      }
    };

    const onMove = (e: MouseEvent) => {
      const coord = screenToImageCoord(e.clientX, e.clientY);
      if (!coord) return;

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

      // 更新光标样式
      if (activeTool === 'select') {
        const currentRects = rectsRef.current;
        const currentArrows = arrowsRef.current;
        const currentTexts = textsRef.current;
        const currentMosaics = mosaicsRef.current;
        const canvas = annotationCanvasRef.current;
        const ctx = canvas?.getContext('2d');

        // 检测文字光标
        if (selectedTextIdRef.current && ctx) {
          const selectedText = currentTexts.find(
            (t) => t.id === selectedTextIdRef.current,
          );
          if (selectedText) {
            const dragType = getTextDragTypeAtPoint(coord.x, coord.y, selectedText, ctx);
            el.style.cursor = TEXT_CURSOR_MAP[dragType];
            return;
          }
        }

        // 检测马赛克光标
        if (selectedMosaicIdRef.current) {
          const selectedMosaic = currentMosaics.find(
            (m) => m.id === selectedMosaicIdRef.current,
          );
          if (selectedMosaic) {
            const dragType = getMosaicDragTypeAtPoint(coord.x, coord.y, selectedMosaic);
            el.style.cursor = MOSAIC_CURSOR_MAP[dragType];
            return;
          }
        }

        // 检测矩形光标
        if (selectedRectIdRef.current) {
          const selectedRect = currentRects.find(
            (r) => r.id === selectedRectIdRef.current,
          );
          if (selectedRect) {
            const dragType = getRectDragTypeAtPoint(coord.x, coord.y, selectedRect);
            el.style.cursor = RECT_CURSOR_MAP[dragType];
            return;
          }
        }

        // 检测箭头光标
        if (selectedArrowIdRef.current) {
          const selectedArrow = currentArrows.find(
            (a) => a.id === selectedArrowIdRef.current,
          );
          if (selectedArrow) {
            const dragType = getDragTypeAtPoint(coord.x, coord.y, selectedArrow);
            if (dragType === 'start' || dragType === 'end') {
              el.style.cursor = 'crosshair';
            } else if (dragType === 'move') {
              el.style.cursor = 'move';
            } else {
              el.style.cursor = 'default';
            }
            return;
          }
        }

        el.style.cursor = 'default';
      }
    };

    const onUp = () => {
      // 结束箭头绘制
      if (isDrawingArrow.current && drawingArrow.current) {
        const { startX, startY, endX, endY } = drawingArrow.current;
        const dist = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        const minDrawDist = 5;
        if (dist > minDrawDist) {
          const newArrow: ArrowShape = {
            id: generateId(),
            startX,
            startY,
            endX,
            endY,
            ...arrowStyleRef.current,
          };
          setArrows((prev) => [...prev, newArrow]);
          setSelectedArrowId(newArrow.id);
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
          const newRect: RectShape = {
            id: generateRectId(),
            x: Math.min(startX, endX),
            y: Math.min(startY, endY),
            width,
            height,
            ...rectStyleRef.current,
          };
          setRects((prev) => [...prev, newRect]);
          setSelectedRectId(newRect.id);
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
          const newMosaic: MosaicShape = {
            id: generateMosaicId(),
            x: Math.min(startX, endX),
            y: Math.min(startY, endY),
            width,
            height,
            ...mosaicStyleRef.current,
          };
          setMosaics((prev) => [...prev, newMosaic]);
          setSelectedMosaicId(newMosaic.id);
          setActiveTool('select');
        }
      }
      isDrawingMosaic.current = false;
      drawingMosaic.current = null;

      // 结束拖拽
      draggingRef.current = null;
      draggingRectRef.current = null;
      draggingTextRef.current = null;
      draggingMosaicRef.current = null;

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
  }, [activeTool, imageData, selectedArrowId, selectedRectId, selectedTextId, selectedMosaicId, editingTextId, screenToImageCoord, renderShapes]);

  // 标注变化时重新渲染
  useEffect(() => {
    renderShapes();
  }, [arrows, rects, texts, mosaics, selectedArrowId, selectedRectId, selectedTextId, selectedMosaicId, renderShapes]);

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

  // Delete 键删除选中的箭头、矩形或文字
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // 避免在输入框中触发
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }

        // 删除选中的箭头
        if (selectedArrowId) {
          setArrows((prev) => prev.filter((a) => a.id !== selectedArrowId));
          setSelectedArrowId(null);
        }

        // 删除选中的矩形
        if (selectedRectId) {
          setRects((prev) => prev.filter((r) => r.id !== selectedRectId));
          setSelectedRectId(null);
        }

        // 删除选中的文字
        if (selectedTextId) {
          setTexts((prev) => prev.filter((t) => t.id !== selectedTextId));
          setSelectedTextId(null);
        }

        // 删除选中的马赛克
        if (selectedMosaicId) {
          setMosaics((prev) => prev.filter((m) => m.id !== selectedMosaicId));
          setSelectedMosaicId(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArrowId, selectedRectId, selectedTextId, selectedMosaicId]);

  // 双击文字进入编辑模式
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !imageData) return;

    const onDoubleClick = (e: MouseEvent) => {
      if (activeTool !== 'select') return;

      const coord = screenToImageCoord(e.clientX, e.clientY);
      if (!coord) return;

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
          setSelectedTextId(text.id);
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
  }, [activeTool, imageData, screenToImageCoord]);

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

  const handleImageLoad = useCallback((dataUrl: string) => {
    setImageData(dataUrl);
    setError(null);
  }, []);

  const showPlaceholder = source === 'upload' && !imageData && !error;

  return (
    <div className="editor-container w-screen h-screen flex overflow-hidden">
      {/* 左侧工具栏 */}
      <Toolbar activeTool={activeTool} onSelectTool={setActiveTool} />

      {/* 中央画布 */}
      <main
        ref={canvasRef}
        className="editor-canvas flex-1 h-full relative overflow-hidden"
        style={{
          cursor:
            activeTool === 'move'
              ? 'grab'
              : activeTool === 'arrow' || activeTool === 'rect' || activeTool === 'text' || activeTool === 'mosaic'
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
              <CanvasImage src={imageData} onSizeChange={handleImageSizeChange} />
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
      />
    </div>
  );
};

export default App;
