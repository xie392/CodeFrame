import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  Check,
  ClipboardCopy,
  Image,
  Minus,
  Plus,
  RotateCcw,
  Settings2,
  Palette,
} from 'lucide-react';
import { useDrag } from '@use-gesture/react';
import { snapdom } from '@zumer/snapdom';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@shared/components/ui/tooltip';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@shared/components/ui/popover';
import {
  THEMES,
  type ThemeConfig,
} from './config/themes';
import {
  BACKGROUNDS,
  type BackdropConfig,
} from './config/backgrounds';

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

const DEFAULT_CODE = `const greet = (name) => {
  return \`Hello, \${name}!\`;
};

export default greet;`;

const MIN_SCALE = 0.25;
const MAX_SCALE = 4;
const MIN_WIN_W = 320;
const MAX_WIN_W = 1200;
const MAX_WIN_H = 800;

const HEADER_HEIGHT = 40;
const BODY_PADDING_V = 40;
const MIN_CODE_LINES = 1;

const DEFAULT_PADDING = {
  top: 40,
  right: 40,
  bottom: 40,
  left: 40,
} as const;

const MAX_PADDING_VALUE = 120;

const DEFAULT_OUTER_BORDER_RADIUS = 16;
const DEFAULT_INNER_BORDER_RADIUS = 12;
const MAX_BORDER_RADIUS = 30;

// 字体列表
const FONT_OPTIONS = [
  { id: 'jetbrains', label: 'JetBrains Mono', family: "'JetBrains Mono', monospace" },
  { id: 'fira-code', label: 'Fira Code', family: "'Fira Code', monospace" },
  { id: 'source-code-pro', label: 'Source Code Pro', family: "'Source Code Pro', monospace" },
  { id: 'ibm-plex', label: 'IBM Plex Mono', family: "'IBM Plex Mono', monospace" },
] as const;

type Padding = { top: number; right: number; bottom: number; left: number };

function isUniformPadding(p: Padding): boolean {
  return p.top === p.right && p.right === p.bottom && p.bottom === p.left;
}

function calcAutoHeight(
  codeText: string,
  showHeader: boolean,
  fontSize: number,
): number {
  const lineHeight = fontSize + 7; // 行高 = 字号 + 7px 间距
  const lines = codeText.split('\n').length;
  const headerH = showHeader ? HEADER_HEIGHT : 0;
  const total = headerH + BODY_PADDING_V + Math.max(MIN_CODE_LINES, lines) * lineHeight;
  return Math.min(MAX_WIN_H, total);
}

// ---------------------------------------------------------------------------
// PaddingInput 子组件
// ---------------------------------------------------------------------------

const PaddingInput: React.FC<{
  label: string;
  value: number;
  onChange: (v: number) => void;
}> = ({ label, value, onChange }) => (
  <div className="flex flex-col items-center gap-0.5">
    <span className="text-[9px] leading-none" style={{ color: '#999' }}>
      {label}
    </span>
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '');
        const cleaned = raw.replace(/^0+(?=\d)/, '');
        const v = Math.min(
          MAX_PADDING_VALUE,
          Math.max(0, parseInt(cleaned || '0', 10)),
        );
        onChange(v);
      }}
      onFocus={(e) => e.target.select()}
      className="w-full h-6 text-center text-[11px] tabular-nums border rounded outline-none focus:border-emerald-400 transition-colors"
      style={{
        backgroundColor: '#FAFAFA',
        borderColor: 'rgba(0,0,0,0.1)',
        color: '#333',
      }}
    />
  </div>
);

// ---------------------------------------------------------------------------
// SectionLabel 子组件
// ---------------------------------------------------------------------------

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-[11px] leading-none shrink-0" style={{ color: '#3D3D3D' }}>
    {children}
  </span>
);

// ---------------------------------------------------------------------------
// ToggleSwitch 子组件
// ---------------------------------------------------------------------------

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
}> = ({ checked, onChange }) => (
  <button
    className="w-9 h-5 rounded-full relative transition-colors shrink-0"
    style={{
      backgroundColor: checked ? '#00D4AA' : '#D1D5DB',
    }}
    onClick={() => onChange(!checked)}
  >
    <div
      className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
      style={{
        backgroundColor: '#fff',
        left: checked ? '18px' : '2px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }}
    />
  </button>
);

// ---------------------------------------------------------------------------
// SliderControl 子组件
// ---------------------------------------------------------------------------

const SliderControl: React.FC<{
  min: number;
  max: number;
  step?: number;
  value: number;
  displayValue: string;
  onChange: (v: number) => void;
}> = ({ min, max, step = 1, value, displayValue, onChange }) => (
  <div className="w-full flex items-center gap-2">
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="flex-1 accent-emerald-500 h-1"
    />
    <span
      className="text-[10px] w-8 text-right tabular-nums shrink-0"
      style={{ color: '#666' }}
    >
      {displayValue}
    </span>
  </div>
);

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const App: React.FC = () => {
  // ---- 主题 & 背景 & 样式 ----
  const [code, setCode] = useState(DEFAULT_CODE);
  const [selectedTheme, setSelectedTheme] = useState('vscode-dark');
  const [selectedBg, setSelectedBg] = useState('indigo');
  const [customBgColor, setCustomBgColor] = useState('#6366F1');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [padding, setPadding] = useState<Padding>({ ...DEFAULT_PADDING });

  // 窗口视觉
  const [borderRadiusState, setBorderRadiusState] = useState({
    outer: DEFAULT_OUTER_BORDER_RADIUS,
    inner: DEFAULT_INNER_BORDER_RADIUS,
  });
  const [shadowEnabled, setShadowEnabled] = useState(true);
  const [shadowIntensity, setShadowIntensity] = useState(50);
  const [showHeader, setShowHeader] = useState(true);
  const [fileName, setFileName] = useState('greet.js');

  // 字体
  const [selectedFont, setSelectedFont] = useState('jetbrains');
  const [fontSize, setFontSize] = useState(13);

  // 水印
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState('CodeFrame');
  const [watermarkOpacity, setWatermarkOpacity] = useState(50);

  // 派生状态
  const currentTheme: ThemeConfig =
    THEMES.find((t) => t.id === selectedTheme) ?? THEMES[0];
  const selectedBgConfig: BackdropConfig | undefined =
    BACKGROUNDS.find((b) => b.id === selectedBg);
  const {
    outer: outerBorderRadius,
    inner: innerBorderRadius,
  } = borderRadiusState;
  const selectedFontConfig = FONT_OPTIONS.find(
    (f) => f.id === selectedFont,
  ) ?? FONT_OPTIONS[0];

  // ---- 画布状态 ----
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // ---- 代码窗口状态 ----
  const [winSize, setWinSize] = useState({
    width: 520,
    height: calcAutoHeight(DEFAULT_CODE, true, 13),
  });
  const [isEditing, setIsEditing] = useState(false);
  const manualResized = useRef(false);
  const codeWindowRef = useRef<HTMLDivElement>(null);

  // ---- Refs ----
  const scaleRef = useRef(scale);
  const offsetRef = useRef(offset);
  const isEditingRef = useRef(isEditing);
  const paddingRef = useRef(padding);
  const winSizeRef = useRef(winSize);
  const codeRef = useRef(code);
  const showHeaderRef = useRef(showHeader);
  const fontSizeRef = useRef(fontSize);

  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { offsetRef.current = offset; }, [offset]);
  useEffect(() => { isEditingRef.current = isEditing; }, [isEditing]);
  useEffect(() => { paddingRef.current = padding; }, [padding]);
  useEffect(() => { winSizeRef.current = winSize; }, [winSize]);
  useEffect(() => { codeRef.current = code; }, [code]);
  useEffect(() => { showHeaderRef.current = showHeader; }, [showHeader]);
  useEffect(() => { fontSizeRef.current = fontSize; }, [fontSize]);

  // ---- 缩放 ----
  const zoomAt = useCallback(
    (newScale: number, anchorX: number, anchorY: number) => {
      const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
      const oldScale = scaleRef.current;
      const ratio = clamped / oldScale;
      const old = offsetRef.current;
      setScale(clamped);
      setOffset({
        x: anchorX * (1 - ratio) + old.x * ratio,
        y: anchorY * (1 - ratio) + old.y * ratio,
      });
    },
    [],
  );

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (isEditingRef.current) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      zoomAt(scaleRef.current * factor, rect.width / 2, rect.height / 2);
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [zoomAt]);

  // ---- 键盘 ----
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && isEditingRef.current) {
        exitEditRef.current();
      }
    };
    window.addEventListener('keydown', onDown);
    return () => {
      window.removeEventListener('keydown', onDown);
    };
  }, []);

  // ---- 拖拽 ----
  const bindResize = useDrag(
    ({ delta: [dx, dy], movement: [mx, my] }) => {
      if (Math.abs(mx) > 8 || Math.abs(my) > 8) {
        manualResized.current = true;
      }
      setWinSize((p) => ({
        width: Math.min(MAX_WIN_W, Math.max(MIN_WIN_W, p.width + dx)),
        height: Math.min(
          MAX_WIN_H,
          Math.max(
            calcAutoHeight(codeRef.current, showHeaderRef.current, fontSizeRef.current),
            p.height + dy,
          ),
        ),
      }));
    },
    { filterTaps: true },
  );

  // ---- 缩放控制 ----
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

  // ---- 退出编辑 ----
  const exitEdit = useCallback(() => {
    setIsEditing(false);
    if (!manualResized.current) {
      setWinSize((p) => ({
        ...p,
        height: calcAutoHeight(code, showHeader, fontSize),
      }));
    }
  }, [code, showHeader, fontSize]);

  const exitEditRef = useRef(exitEdit);
  useEffect(() => { exitEditRef.current = exitEdit; }, [exitEdit]);

  // ---- 导出 / 复制 ----
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleExportImage = useCallback(async () => {
    const el = exportRef.current;
    if (!el) return;
    setIsExporting(true);
    try {
      // 退出编辑模式以隐藏光标
      if (isEditingRef.current) exitEditRef.current();
      // 等待 DOM 更新
      await new Promise((r) => setTimeout(r, 50));
      const img = await snapdom.toPng(el, {
        scale: 2,
        exclude: ['[data-no-export]'],
      });
      const a = document.createElement('a');
      a.href = img.src;
      a.download = `codeframe-${Date.now()}.png`;
      a.click();
    } catch (err) {
      console.error('导出失败:', err);
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleCopyToClipboard = useCallback(async () => {
    const el = exportRef.current;
    if (!el) return;
    if (!navigator.clipboard?.write) {
      alert('当前浏览器不支持复制图片到剪贴板');
      return;
    }
    try {
      if (isEditingRef.current) exitEditRef.current();
      await new Promise((r) => setTimeout(r, 50));
      const blob = await snapdom.toBlob(el, {
        scale: 2,
        type: 'png',
        exclude: ['[data-no-export]'],
      });
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  }, []);

  // ---- 编辑器配置 ----
  // 字体和行高覆盖（与主题无关的排版配置）
  const editorStyleOverrides = useMemo(
    () =>
      EditorView.theme({
        '&': {
          fontSize: `${fontSize}px`,
          fontFamily: selectedFontConfig.family,
        },
        '.cm-content': {
          padding: '20px 20px 20px 8px',
          lineHeight: `${fontSize + 7}px`,
          fontFamily: selectedFontConfig.family,
        },
        '.cm-lineNumbers': {
          width: '32px',
          minWidth: '32px',
        },
        '.cm-lineNumbers .cm-gutterElement': {
          padding: '0 4px 0 0',
          textAlign: 'right',
          opacity: '0.4',
          fontFamily: selectedFontConfig.family,
        },
        '.cm-focused': {
          outline: 'none',
        },
        '.cm-editor [contenteditable=false] .cm-content': {
          caretColor: 'transparent',
        },
      }),
    [fontSize, selectedFontConfig.family],
  );

  const cmExtensions = useMemo(
    () => [
      javascript(),
      editorStyleOverrides,
      EditorView.contentAttributes.of({ tabindex: '0' }),
    ],
    [editorStyleOverrides],
  );

  // ---- 自适应高度 ----
  useEffect(() => {
    if (!manualResized.current) {
      setWinSize((p) => ({
        ...p,
        height: calcAutoHeight(code, showHeader, fontSize),
      }));
    }
  }, [code, showHeader, fontSize]);

  // ---- 背景样式 ----
  const getBackgroundCss = (): string => {
    if (selectedBg === 'custom') return customBgColor;
    return selectedBgConfig?.css ?? '#6366F1';
  };

  // ---- 窗口阴影 ----
  const windowShadow = useMemo(() => {
    if (!shadowEnabled) return 'none';
    const alpha = shadowIntensity / 100;
    return `0 8px ${20 + shadowIntensity * 0.3}px rgba(0,0,0,${0.15 * alpha})`;
  }, [shadowEnabled, shadowIntensity]);

  // -----------------------------------------------------------------------
  // 渲染
  // -----------------------------------------------------------------------
  return (
    <div
      className="w-screen h-screen flex font-body"
      style={{
        background:
          'linear-gradient(180deg, #F0F0F8 0%, #EAEAF2 50%, #E0E0EA 100%)',
      }}
    >
      {/* ================================================================ */}
      {/* LeftPanel                                                        */}
      {/* ================================================================ */}
      <aside
        className="w-[240px] h-full shrink-0 flex flex-col gap-3 p-4 overflow-y-auto"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0.33) 100%)',
          border: '1px solid rgba(255,255,255,0.44)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}
      >
        {/* Theme Selector */}
        <div className="flex flex-col gap-2 shrink-0">
          <SectionLabel>主题</SectionLabel>
          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="w-full h-7 text-[11px] border rounded px-2 outline-none focus:border-emerald-400 transition-colors"
            style={{
              backgroundColor: '#FAFAFA',
              borderColor: 'rgba(0,0,0,0.1)',
              color: '#333',
            }}
          >
            {THEMES.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.label}
              </option>
            ))}
          </select>
        </div>

        {/* Background Selector */}
        <div className="flex flex-col gap-2 shrink-0">
          <SectionLabel>背景</SectionLabel>
          <TooltipProvider delayDuration={300}>
            <div className="w-full grid grid-cols-6 gap-1.5">
              {BACKGROUNDS.map((bg) => (
                <Tooltip key={bg.id}>
                  <TooltipTrigger asChild>
                    <button
                      className="w-full aspect-square shrink-0 rounded-md relative overflow-hidden"
                      style={{
                        background: bg.preview,
                        border:
                          selectedBg === bg.id
                            ? '2px solid #FF6B35'
                            : '2px solid transparent',
                      }}
                      onClick={() => setSelectedBg(bg.id)}
                    >
                      {selectedBg === bg.id && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            className="w-3 h-3 rounded-full flex items-center justify-center"
                            style={{
                              backgroundColor: 'rgba(255,255,255,0.9)',
                            }}
                          >
                            <Check size={8} style={{ color: '#333' }} />
                          </div>
                        </div>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{bg.label}</TooltipContent>
                </Tooltip>
              ))}
              {/* 自定义颜色 */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <label
                    className="w-full aspect-square shrink-0 rounded-md flex items-center justify-center cursor-pointer relative overflow-hidden"
                    style={{
                      border:
                        selectedBg === 'custom'
                          ? '2px solid #FF6B35'
                          : '2px solid rgba(0,0,0,0.08)',
                    }}
                  >
                    <Palette size={12} style={{ color: '#999', pointerEvents: 'none' }} />
                    <input
                      type="color"
                      value={customBgColor}
                      onChange={(e) => {
                        setCustomBgColor(e.target.value);
                        setSelectedBg('custom');
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </label>
                </TooltipTrigger>
                <TooltipContent>自定义颜色</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        {/* Padding Selector */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <SectionLabel>内边距</SectionLabel>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/5 transition-colors"
                  style={{
                    color: isUniformPadding(padding)
                      ? '#999'
                      : '#FF6B35',
                  }}
                >
                  <Settings2 size={12} />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="end"
                sideOffset={8}
                className="w-auto !p-3 !rounded-lg"
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                <div className="grid grid-cols-3 gap-2 w-[140px]">
                  <div />
                  <PaddingInput
                    label="上"
                    value={padding.top}
                    onChange={(v) => setPadding((p) => ({ ...p, top: v }))}
                  />
                  <div />
                  <PaddingInput
                    label="左"
                    value={padding.left}
                    onChange={(v) => setPadding((p) => ({ ...p, left: v }))}
                  />
                  <button
                    className="w-full h-6 flex items-center justify-center rounded text-[10px] hover:bg-black/5 transition-colors"
                    style={{ color: '#999' }}
                    onClick={() =>
                      setPadding({ top: 0, right: 0, bottom: 0, left: 0 })
                    }
                  >
                    0
                  </button>
                  <PaddingInput
                    label="右"
                    value={padding.right}
                    onChange={(v) => setPadding((p) => ({ ...p, right: v }))}
                  />
                  <div />
                  <PaddingInput
                    label="下"
                    value={padding.bottom}
                    onChange={(v) => setPadding((p) => ({ ...p, bottom: v }))}
                  />
                  <div />
                </div>
                {!isUniformPadding(padding) && (
                  <button
                    className="w-full mt-2 pt-2 text-[10px] text-center hover:bg-black/5 rounded transition-colors"
                    style={{
                      color: '#999',
                      borderTop: '1px solid rgba(0,0,0,0.06)',
                    }}
                    onClick={() =>
                      setPadding({
                        top: padding.top,
                        right: padding.top,
                        bottom: padding.top,
                        left: padding.top,
                      })
                    }
                  >
                    统一为 {padding.top}
                  </button>
                )}
              </PopoverContent>
            </Popover>
          </div>
          <SliderControl
            min={0}
            max={MAX_PADDING_VALUE}
            value={isUniformPadding(padding) ? padding.top : -1}
            displayValue={isUniformPadding(padding) ? `${padding.top}` : '···'}
            onChange={(v) =>
              setPadding({ top: v, right: v, bottom: v, left: v })
            }
          />
        </div>

        {/* Window Visual Controls */}
        <div className="flex flex-col gap-2 shrink-0">
          <SectionLabel>窗口</SectionLabel>
          <div className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: '#999' }}>
              标题栏
            </span>
            <ToggleSwitch checked={showHeader} onChange={setShowHeader} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: '#999' }}>
              行号
            </span>
            <ToggleSwitch
              checked={showLineNumbers}
              onChange={setShowLineNumbers}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: '#999' }}>
              阴影
            </span>
            <ToggleSwitch checked={shadowEnabled} onChange={setShadowEnabled} />
          </div>
          {shadowEnabled && (
            <SliderControl
              min={0}
              max={100}
              value={shadowIntensity}
              displayValue={`${shadowIntensity}%`}
              onChange={setShadowIntensity}
            />
          )}
        </div>

        {/* Border Radius Controls */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <SectionLabel>圆角</SectionLabel>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/5 transition-colors"
                  style={{
                    color:
                      outerBorderRadius === innerBorderRadius
                        ? '#999'
                        : '#FF6B35',
                  }}
                >
                  <Settings2 size={12} />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="end"
                sideOffset={8}
                className="w-auto !p-3 !rounded-lg"
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              >
                <div className="flex flex-col gap-3 w-[180px]">
                  <div className="flex flex-col gap-1">
                    <span
                      className="text-[9px] leading-none"
                      style={{ color: '#999' }}
                    >
                      外圆角
                    </span>
                    <SliderControl
                      min={0}
                      max={MAX_BORDER_RADIUS}
                      value={outerBorderRadius}
                      displayValue={`${outerBorderRadius}px`}
                      onChange={(v) =>
                        setBorderRadiusState((s) => ({ ...s, outer: v }))
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span
                      className="text-[9px] leading-none"
                      style={{ color: '#999' }}
                    >
                      内圆角
                    </span>
                    <SliderControl
                      min={0}
                      max={MAX_BORDER_RADIUS}
                      value={innerBorderRadius}
                      displayValue={`${innerBorderRadius}px`}
                      onChange={(v) =>
                        setBorderRadiusState((s) => ({ ...s, inner: v }))
                      }
                    />
                  </div>
                  {outerBorderRadius !== innerBorderRadius && (
                    <button
                      className="w-full pt-2 text-[10px] text-center hover:bg-black/5 rounded transition-colors"
                      style={{
                        color: '#999',
                        borderTop: '1px solid rgba(0,0,0,0.06)',
                      }}
                      onClick={() => {
                        const avg = Math.round(
                          (outerBorderRadius + innerBorderRadius) / 2,
                        );
                        setBorderRadiusState({ outer: avg, inner: avg });
                      }}
                    >
                      统一为{' '}
                      {Math.round(
                        (outerBorderRadius + innerBorderRadius) / 2,
                      )}
                      px
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <SliderControl
            min={0}
            max={MAX_BORDER_RADIUS}
            value={
              outerBorderRadius === innerBorderRadius
                ? innerBorderRadius
                : Math.round(
                    (outerBorderRadius + innerBorderRadius) / 2,
                  )
            }
            displayValue={
              outerBorderRadius === innerBorderRadius
                ? `${innerBorderRadius}px`
                : '···'
            }
            onChange={(v) =>
              setBorderRadiusState({ outer: v, inner: v })
            }
          />
        </div>

        {/* Font Selector */}
        <div className="flex flex-col gap-2 shrink-0">
          <SectionLabel>字体</SectionLabel>
          <div className="w-full flex flex-col gap-1.5">
            <select
              value={selectedFont}
              onChange={(e) => setSelectedFont(e.target.value)}
              className="w-full h-7 text-[11px] border rounded px-2 outline-none focus:border-emerald-400 transition-colors"
              style={{
                backgroundColor: '#FAFAFA',
                borderColor: 'rgba(0,0,0,0.1)',
                color: '#333',
                fontFamily: selectedFontConfig.family,
              }}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            <SliderControl
              min={12}
              max={24}
              value={fontSize}
              displayValue={`${fontSize}px`}
              onChange={(v) => {
                setFontSize(v);
                if (!manualResized.current) {
                  setWinSize((p) => ({
                    ...p,
                    height: calcAutoHeight(code, showHeader, v),
                  }));
                }
              }}
            />
          </div>
        </div>

        {/* Watermark */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <SectionLabel>水印</SectionLabel>
            <ToggleSwitch
              checked={watermarkEnabled}
              onChange={setWatermarkEnabled}
            />
          </div>
          {watermarkEnabled && (
            <>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="水印文字..."
                className="w-full h-7 text-[11px] border rounded px-2 outline-none focus:border-emerald-400 transition-colors"
                style={{
                  backgroundColor: '#FAFAFA',
                  borderColor: 'rgba(0,0,0,0.1)',
                  color: '#333',
                }}
              />
              <SliderControl
                min={10}
                max={90}
                value={watermarkOpacity}
                displayValue={`${watermarkOpacity}%`}
                onChange={setWatermarkOpacity}
              />
            </>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Export Button Group */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportImage}
            disabled={isExporting}
            className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ backgroundColor: '#00D4AA' }}
          >
            <Image size={16} style={{ color: '#0D0D0D' }} />
            <span
              className="text-[13px] font-semibold leading-none"
              style={{ color: '#0D0D0D' }}
            >
              {isExporting ? '导出中...' : '导出图片'}
            </span>
          </button>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleCopyToClipboard}
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                  style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}
                >
                  {copied ? (
                    <Check size={16} style={{ color: '#00D4AA' }} />
                  ) : (
                    <ClipboardCopy size={16} style={{ color: '#00D4AA' }} />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                <p className="text-[12px]">{copied ? '已复制' : '复制到剪贴板'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </aside>

      {/* ================================================================ */}
      {/* Canvas Area                                                      */}
      {/* ================================================================ */}
      <main
        ref={canvasRef}
        className="flex-1 h-full relative overflow-hidden"
        style={{
          backgroundColor: '#E8E8F0',
        }}
      >
        {/* ---- Transform Layer ---- */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
        >
          {/* ---- Export Container (Background + Code Window) ---- */}
          <div
            ref={exportRef}
            className="absolute overflow-hidden"
            style={{
              left: `calc(50% - ${winSize.width / 2}px - ${padding.left}px)`,
              top: `calc(50% - ${winSize.height / 2}px - ${padding.top}px)`,
              width: winSize.width + padding.left + padding.right,
              height: winSize.height + padding.top + padding.bottom,
            }}
          >
            {/* Background (always render for export consistency) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: getBackgroundCss(),
                borderRadius: `${outerBorderRadius}px`,
              }}
            ></div>

            {/* ---- Code Window ---- */}
            <div
              ref={codeWindowRef}
              data-code-window
              className="flex flex-col overflow-hidden absolute"
              style={{
                left: padding.left,
                top: padding.top,
                width: winSize.width,
                height: winSize.height,
                backgroundColor: currentTheme.windowBg,
                borderRadius: `${innerBorderRadius}px`,
                boxShadow: windowShadow,
                userSelect: isEditing ? 'auto' : 'none',
              }}
            >
            {/* Window Header */}
            {showHeader && (
              <div
                className="w-full h-10 flex items-center gap-2 px-4 shrink-0"
                style={{
                  backgroundColor: currentTheme.headerBg,
                  borderRadius: `${innerBorderRadius}px ${innerBorderRadius}px 0 0`,
                }}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: '#FF5F56' }}
                />
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: '#FFBD2E' }}
                />
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: '#27C93F' }}
                />
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="text-[12px] ml-2 bg-transparent border-none outline-none flex-1 min-w-0"
                  style={{ color: '#777777', cursor: 'text' }}
                  onKeyDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            {/* Window Body */}
            <div
              className="w-full flex-1 overflow-hidden relative"
              style={{
                borderRadius: showHeader
                  ? '0 0 ' + `${innerBorderRadius}px ${innerBorderRadius}px`
                  : `${innerBorderRadius}px`,
              }}
            >
              <CodeMirror
                value={code}
                onChange={(value) => {
                  setCode(value);
                }}
                onFocus={() => {
                  if (!isEditing) {
                    setIsEditing(true);
                    manualResized.current = false;
                  }
                }}
                onBlur={() => {
                  if (codeWindowRef.current?.contains(document.activeElement)) return;
                  exitEdit();
                }}
                theme={currentTheme.editorTheme}
                extensions={cmExtensions}
                editable={isEditing}
                readOnly={!isEditing}
                basicSetup={{
                  lineNumbers: showLineNumbers,
                  bracketMatching: true,
                  indentOnInput: true,
                  tabSize: 2,
                  foldGutter: false,
                }}
                className="w-full h-full"
                style={{
                  height: '100%',
                  cursor: isEditing ? 'text' : 'default',
                }}
              />
            </div>

            {/* Resize Handle */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
              data-no-export
              style={{
                borderRight: '2px solid rgba(128,128,128,0.3)',
                borderBottom: '2px solid rgba(128,128,128,0.3)',
                borderRadius: `0 0 ${innerBorderRadius}px 0`,
              }}
              {...bindResize()}
            />

            {/* Watermark */}
            {watermarkEnabled && watermarkText && (
              <div
                className="absolute bottom-3 right-4 pointer-events-none select-none"
                style={{
                  opacity: watermarkOpacity / 100,
                  color: currentTheme.isDark
                    ? 'rgba(255,255,255,0.6)'
                    : 'rgba(0,0,0,0.4)',
                  fontFamily: selectedFontConfig.family,
                  fontSize: '11px',
                  lineHeight: '1',
                }}
              >
                {watermarkText}
              </div>
            )}
          </div>
        </div>
      </div>

        {/* ---- Zoom Controls ---- */}
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
            onChange={(e) => handleSlider(parseFloat(e.target.value))}
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
      </main>
    </div>
  );
};

export default App;
