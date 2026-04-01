import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  type DragEvent,
  type ClipboardEvent,
} from 'react';
import {
  MousePointer2,
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

type EditorSource = 'capture' | 'upload';
type ToolId = 'select' | 'arrow' | 'rect' | 'text' | 'mosaic' | 'crop';

interface ToolConfig {
  id: ToolId;
  icon: React.ReactNode;
}

const TOOLS: ToolConfig[] = [
  { id: 'select', icon: <MousePointer2 size={18} /> },
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

/** 数值输入字段 */
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

/** 右侧属性面板 */
const PropertiesPanel: React.FC = () => (
  <aside className="properties-panel w-[350px] h-full flex flex-col gap-4 p-5 shrink-0 overflow-y-auto">
    <span className="text-[12px] text-[var(--color-editor-comment)] font-body">
      // properties
    </span>

    {/* [position] 区域 */}
    <div className="flex flex-col gap-[10px]">
      <span className="text-[11px] font-body font-semibold"
        style={{ color: 'var(--color-accent-orange)' }}
      >
        [position]
      </span>
      <div className="flex gap-2">
        <PropField label="x" value="0" />
        <PropField label="y" value="0" />
      </div>
      <div className="flex gap-2">
        <PropField label="w" value="0" />
        <PropField label="h" value="0" />
      </div>
    </div>

    {/* [style] 区域 */}
    <div className="flex flex-col gap-[10px]">
      <span className="text-[11px] font-body font-semibold"
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

    {/* 操作按钮 */}
    <div className="flex flex-col gap-2 mt-auto">
      <button
        className="export-btn w-full h-[40px] rounded-[12px] flex items-center justify-center gap-2 cursor-pointer"
      >
        <Download size={16} style={{ color: '#0D0D0D' }} />
        <span
          className="text-[12px] font-body font-semibold leading-none"
          style={{ color: '#0D0D0D' }}
        >
          $ export_image
        </span>
      </button>
      <button
        className="copy-btn w-full h-[40px] rounded-[12px] flex items-center justify-center gap-2 cursor-pointer"
      >
        <ClipboardCopy size={16} className="text-[var(--color-editor-hint)]" />
        <span className="text-[12px] font-body font-semibold leading-none text-[var(--color-editor-hint)]">
          $ copy_to_clipboard
        </span>
      </button>
    </div>
  </aside>
);

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
      if (e.button !== 0 || !imageData) return;
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      panOffsetStart.current = offsetRef.current;
      el.style.cursor = 'grabbing';
    };

    const onMove = (e: MouseEvent) => {
      if (!isPanning.current) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setOffset({
        x: panOffsetStart.current.x + dx,
        y: panOffsetStart.current.y + dy,
      });
    };

    const onUp = () => {
      isPanning.current = false;
      el.style.cursor = 'grab';
    };

    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      el.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

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
        style={{ cursor: 'grab' }}
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
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: '0 0',
              }}
            >
              <CanvasImage src={imageData} />
            </div>

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
      <PropertiesPanel />
    </div>
  );
};

export default App;
