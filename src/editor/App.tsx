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

type EditorSource = 'capture' | 'upload';
type ToolId = 'select' | 'move' | 'arrow' | 'rect' | 'text' | 'mosaic' | 'crop';
type ArrowStyle = 'single' | 'double';

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

// 控制点半径
const HANDLE_RADIUS = 6;

// 拖拽类型
type DragType = 'none' | 'move' | 'start' | 'end';

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

/** 右侧属性面板 */
const PropertiesPanel: React.FC<{
  selectedArrow: ArrowShape | null;
  onUpdateArrow: (updates: Partial<ArrowShape>) => void;
}> = ({ selectedArrow, onUpdateArrow }) => {
  // 只有选中箭头时才显示箭头配置
  const showArrowConfig = selectedArrow !== null;

  const handleColorChange = (color: string) => {
    if (selectedArrow) {
      onUpdateArrow({ color });
    }
  };

  const handleStrokeWidthChange = (strokeWidth: number) => {
    if (selectedArrow) {
      onUpdateArrow({ strokeWidth });
    }
  };

  const handleHeadSizeChange = (headSize: number) => {
    if (selectedArrow) {
      onUpdateArrow({ headSize });
    }
  };

  const handleStyleChange = (style: ArrowStyle) => {
    if (selectedArrow) {
      onUpdateArrow({ style });
    }
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
        {selectedArrow ? (
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

      {/* [style] 区域 - 只有选中箭头时显示箭头配置 */}
      {showArrowConfig && selectedArrow ? (
        <div className="flex flex-col gap-[10px]">
          <span
            className="text-[11px] font-body font-semibold"
            style={{ color: 'var(--color-accent-orange)' }}
          >
            [arrow_style]
          </span>
          <ColorPicker
            color={selectedArrow.color}
            onChange={handleColorChange}
          />
          <SliderControl
            label="stroke"
            value={selectedArrow.strokeWidth}
            min={1}
            max={10}
            onChange={handleStrokeWidthChange}
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
const CanvasImage: React.FC<{ src: string }> = ({ src }) => {
  const [naturalSize, setNaturalSize] = useState<{
    w: number;
    h: number;
  } | null>(null);

  return (
    <img
      src={src}
      alt="编辑图片"
      onLoad={(e) => {
        const img = e.currentTarget;
        setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      }}
      className="rounded-[8px] shadow-lg"
      draggable={false}
      style={{
        maxWidth: naturalSize
          ? Math.min(MAX_IMG_W, naturalSize.w)
          : MAX_IMG_W,
        maxHeight: naturalSize
          ? Math.min(MAX_IMG_H, naturalSize.h)
          : MAX_IMG_H,
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

  // Canvas 引用
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // 默认箭头样式（用于创建新箭头）
  const arrowStyleRef = useRef(DEFAULT_ARROW_STYLE);

  // 使用 ref 避免闭包陈旧状态
  const arrowsRef = useRef(arrows);
  arrowsRef.current = arrows;

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

  // 绘制所有箭头
  const renderArrows = useCallback(() => {
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

    ctx.restore();
  }, [arrows, selectedArrowId]);

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

  // 选中的箭头
  const selectedArrow = useMemo(
    () => arrows.find((a) => a.id === selectedArrowId) || null,
    [arrows, selectedArrowId],
  );

  // 箭头绘制事件处理
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !imageData) return;

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;

      const coord = screenToImageCoord(e.clientX, e.clientY);
      if (!coord) return;

      if (activeTool === 'arrow') {
        isDrawingArrow.current = true;
        drawingArrow.current = {
          startX: coord.x,
          startY: coord.y,
          endX: coord.x,
          endY: coord.y,
        };
      } else if (activeTool === 'select') {
        const currentArrows = arrowsRef.current;

        // 如果已选中箭头，优先检测控制点
        if (selectedArrowId) {
          const selectedArrow = currentArrows.find(
            (a) => a.id === selectedArrowId,
          );
          if (selectedArrow) {
            const dragType = getDragTypeAtPoint(coord.x, coord.y, selectedArrow);
            if (dragType !== 'none') {
              // 开始拖拽
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

        // 检测是否点击到箭头
        let found = false;
        for (let i = currentArrows.length - 1; i >= 0; i--) {
          const dragType = getDragTypeAtPoint(coord.x, coord.y, currentArrows[i]);
          if (dragType !== 'none') {
            setSelectedArrowId(currentArrows[i].id);
            found = true;
            // 开始拖拽
            draggingRef.current = {
              type: dragType,
              arrowId: currentArrows[i].id,
              startX: coord.x,
              startY: coord.y,
              arrowStart: { x: currentArrows[i].startX, y: currentArrows[i].startY },
              arrowEnd: { x: currentArrows[i].endX, y: currentArrows[i].endY },
            };
            break;
          }
        }
        if (!found) {
          setSelectedArrowId(null);
        }
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
        renderArrows();
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
                return {
                  ...a,
                  startX: drag.arrowStart.x + dx,
                  startY: drag.arrowStart.y + dy,
                };
              case 'end':
                return {
                  ...a,
                  endX: drag.arrowEnd.x + dx,
                  endY: drag.arrowEnd.y + dy,
                };
              default:
                return a;
            }
          }),
        );
        renderArrows();
        return;
      }

      // 更新光标样式
      if (activeTool === 'select' && selectedArrowId) {
        const selectedArrow = arrowsRef.current.find(
          (a) => a.id === selectedArrowId,
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
        }
      }
    };

    const onUp = () => {
      // 结束箭头绘制
      if (isDrawingArrow.current && drawingArrow.current) {
        const { startX, startY, endX, endY } = drawingArrow.current;
        const dist = Math.sqrt(
          (endX - startX) ** 2 + (endY - startY) ** 2,
        );
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
          // 绘制完成后自动切换到选择工具
          setActiveTool('select');
        }
      }
      isDrawingArrow.current = false;
      drawingArrow.current = null;

      // 结束拖拽
      draggingRef.current = null;

      renderArrows();
    };

    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);

    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [activeTool, imageData, selectedArrowId, screenToImageCoord, renderArrows]);

  // 箭头变化时重新渲染
  useEffect(() => {
    renderArrows();
  }, [arrows, selectedArrowId, renderArrows]);

  // 缩放/平移变化时重新渲染
  useEffect(() => {
    renderArrows();
  }, [scale, offset, renderArrows]);

  // Canvas 尺寸调整
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = annotationCanvasRef.current;
      const container = canvasRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      renderArrows();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [renderArrows]);

  // Delete 键删除选中箭头
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedArrowId) {
        // 避免在输入框中触发
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }
        setArrows((prev) => prev.filter((a) => a.id !== selectedArrowId));
        setSelectedArrowId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArrowId]);

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
              : activeTool === 'arrow'
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
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: '0 0',
              }}
            >
              <CanvasImage src={imageData} />
            </div>

            {/* Annotation Canvas Layer */}
            <canvas
              ref={annotationCanvasRef}
              className="absolute inset-0 pointer-events-none"
              style={{ pointerEvents: 'auto' }}
            />

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
      />
    </div>
  );
};

export default App;
