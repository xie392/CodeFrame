# Editor 模块代码地图

**最后更新：** 2026-04-03
**入口点：** `src/editor/App.tsx`
**版本：** v2.0（重构后）

## 架构概览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Editor 模块架构                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         表现层 (Presentation)                        │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────┐  ┌──────────────────┐   │   │
│  │  │ Toolbar │  │Properties│  │ CanvasImage │  │ WatermarkRenderer│   │   │
│  │  │         │  │ Panel   │  │             │  │                  │   │   │
│  │  └────┬────┘  └────┬────┘  └──────┬──────┘  └────────┬─────────┘   │   │
│  │       │            │              │                   │             │   │
│  │  ┌────┴────────────┴──────────────┴───────────────────┴────┐        │   │
│  │  │                    UI 组件 (21个)                        │        │   │
│  │  │  ColorPicker, SliderControl, ToggleSwitch, ...          │        │   │
│  │  └─────────────────────────────────────────────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         业务逻辑层 (Business)                        │   │
│  │                                                                      │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │   │
│  │  │ useEditorHistory │  │   useZoomPan     │  │    useExport     │   │   │
│  │  │   撤销/恢复       │  │   缩放/平移       │  │   导出/复制      │   │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘   │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         状态层 (State)                               │   │
│  │                                                                      │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │                  useEditorStore (Zustand)                      │  │   │
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌──────────┐ │  │   │
│  │  │  │ 图形状态    │ │ 工具状态    │ │ 视图状态    │ │ 导出状态 │ │  │   │
│  │  │  │ arrows      │ │ activeTool  │ │ scale       │ │isExporting│ │  │   │
│  │  │  │ rects       │ │             │ │ offset      │ │ copied   │ │  │   │
│  │  │  │ texts       │ │             │ │             │ │          │ │  │   │
│  │  │  │ mosaics     │ │             │ │             │ │          │ │  │   │
│  │  │  └─────────────┘ └─────────────┘ └─────────────┘ └──────────┘ │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         服务层 (Services)                            │   │
│  │                                                                      │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │                   CanvasRenderer                               │  │   │
│  │  │  drawArrow() / drawRect() / drawText() / drawMosaic()         │  │   │
│  │  │  drawCropBox() / drawMarquee() / drawHandles()                │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         工具层 (Utils)                               │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────┐  ┌─────────────────────────────────┐   │   │
│  │  │      editor.ts          │  │      shape-helpers.ts           │   │   │
│  │  │  parseSource()          │  │  isPointNearArrow()             │   │   │
│  │  │  readFileAsDataUrl()    │  │  isPointInRect()                │   │   │
│  │  │  calculateAspectRatio() │  │  getDragTypeAtPoint()           │   │   │
│  │  │  generateXxxId()        │  │  drawMarqueeRect()              │   │   │
│  │  └─────────────────────────┘  └─────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         基础层 (Foundation)                          │   │
│  │                                                                      │   │
│  │  ┌─────────────────────────┐  ┌─────────────────────────────────┐   │   │
│  │  │      types.ts           │  │      constants.ts               │   │   │
│  │  │  类型定义 (262行)        │  │  常量定义 (276行)                │   │   │
│  │  │  ArrowShape, RectShape  │  │  PRESET_COLORS, DEFAULT_*       │   │   │
│  │  │  ToolId, CropArea, ...  │  │  BACKGROUND_PRESETS, ...        │   │   │
│  │  └─────────────────────────┘  └─────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 目录结构

```
src/editor/
├── App.tsx                    # 主组件入口 (2153 行)
├── main.tsx                   # React 渲染入口
├── index.html                 # HTML 模板
├── types.ts                   # 类型定义 (262 行)
├── constants.ts               # 常量定义 (276 行)
│
├── store/                     # 状态管理
│   ├── editor-store.ts        # Zustand Store (398 行)
│   └── __tests__/
│       └── editor-store.test.ts
│
├── services/                  # 服务层
│   ├── canvas-renderer.ts     # Canvas 渲染服务 (413 行)
│   └── __tests__/
│       └── canvas-renderer.test.ts
│
├── utils/                     # 工具函数
│   ├── editor.ts              # 通用工具 (196 行)
│   ├── shape-helpers.ts       # 图形辅助 (288 行)
│   └── __tests__/
│       └── shape-helpers.test.ts
│
├── hooks/                     # 自定义 Hooks
│   ├── useEditorHistory.ts    # 历史记录 (130 行)
│   ├── useZoomPan.ts          # 缩放平移 (178 行)
│   └── useExport.ts           # 导出功能 (294 行)
│
└── components/                # UI 组件 (21 个)
    ├── Toolbar/               # 工具栏
    ├── PropertiesPanel/       # 属性面板
    ├── FrameSettings/         # 帧设置
    ├── CanvasImage/           # Canvas 图片
    ├── WatermarkRenderer/     # 水印渲染
    ├── UploadPlaceholder/     # 上传占位
    ├── ColorPicker/           # 颜色选择
    ├── SliderControl/         # 滑块控制
    ├── ToggleSwitch/          # 开关切换
    ├── SelectControl/         # 下拉选择
    ├── EditableField/         # 可编辑字段
    ├── CollapsibleSection/    # 可折叠区域
    ├── ArrowStyleToggle/      # 箭头样式
    ├── RectBorderStyleToggle/ # 矩形边框样式
    ├── FontStyleToggle/       # 字体样式
    ├── FontWeightToggle/      # 字体粗细
    ├── BackgroundPresetButton/# 背景预设
    ├── ShadowPresetButton/    # 阴影预设
    └── ImageShadowPresetButton/# 图片阴影预设
```

## 核心模块说明

### 1. 状态层 (store/)

| 文件 | 职责 | 行数 | 关键导出 |
|------|------|------|----------|
| `editor-store.ts` | 统一状态管理 | 398 | `useEditorStore` |

**状态分类：**

```typescript
// 图片状态
source: EditorSource | null
imageData: string | null
imageNaturalSize / imageDisplaySize

// 工具状态
activeTool: 'select' | 'move' | 'arrow' | 'rect' | 'text' | 'mosaic' | 'crop'

// 图形状态
arrows: ArrowShape[] / selectedArrowIds: string[]
rects: RectShape[] / selectedRectIds: string[]
texts: TextShape[] / selectedTextIds: string[]
mosaics: MosaicShape[] / selectedMosaicIds: string[]

// 视图状态
scale: number
offset: { x: number; y: number }

// 导出状态
isExporting: boolean
copied: boolean
```

### 2. 服务层 (services/)

| 文件 | 职责 | 行数 | 关键方法 |
|------|------|------|----------|
| `canvas-renderer.ts` | Canvas 绘图封装 | 413 | `CanvasRenderer` 类 |

**渲染器方法：**

| 方法 | 用途 |
|------|------|
| `drawArrow()` | 绘制箭头（支持单/双箭头） |
| `drawRect()` | 绘制矩形（支持实线/虚线） |
| `drawText()` | 绘制文字 |
| `drawMosaic()` | 绘制马赛克区域 |
| `drawCropBox()` | 绘制裁剪框 |
| `drawHandles()` | 绘制选中控制点 |
| `clear()` | 清除画布 |

### 3. Hooks 层 (hooks/)

| 文件 | 职责 | 行数 | 关键功能 |
|------|------|------|----------|
| `useEditorHistory.ts` | 撤销/恢复 | 130 | 快照模式，最多 50 条历史 |
| `useZoomPan.ts` | 缩放/平移 | 178 | 锚点缩放、滚轮缩放 |
| `useExport.ts` | 导出功能 | 294 | PNG/JPEG/WEBP 导出、剪贴板复制 |

### 4. 工具层 (utils/)

| 文件 | 职责 | 行数 | 关键函数 |
|------|------|------|----------|
| `editor.ts` | 通用工具 | 196 | `parseSource`, `readFileAsDataUrl`, `generateXxxId` |
| `shape-helpers.ts` | 图形计算 | 288 | `isPointNearArrow`, `getDragTypeAtPoint` |

**核心工具函数：**

```typescript
// editor.ts - 通用工具
parseSource(): 'capture' | 'upload' | null
readFileAsDataUrl(file: File): Promise<string>
calculateAspectRatioSize(): { width, height }
generateArrowId() / generateRectId() / generateTextId() / generateMosaicId()
getBackgroundStyle(bg): React.CSSProperties

// shape-helpers.ts - 图形计算
isPointNearArrow(x, y, arrow): boolean
isPointInRect(x, y, rect): boolean
getDragTypeAtPoint(x, y, arrow): DragType
getRectDragTypeAtPoint(x, y, rect): RectDragType
isArrowInRect / isRectInRect / isTextInRect
```

### 5. 组件层 (components/)

**主要组件：**

| 组件 | 职责 | 位置 |
|------|------|------|
| `Toolbar` | 工具栏（工具选择、缩放控制） | `components/Toolbar/` |
| `PropertiesPanel` | 属性面板（图形属性编辑） | `components/PropertiesPanel/` |
| `FrameSettings` | 帧设置（背景、边距、圆角） | `components/FrameSettings/` |
| `CanvasImage` | Canvas 图片渲染 | `components/CanvasImage/` |
| `WatermarkRenderer` | 水印渲染 | `components/WatermarkRenderer/` |
| `UploadPlaceholder` | 上传占位区域 | `components/UploadPlaceholder/` |

**UI 控件组件：**

| 组件 | 职责 |
|------|------|
| `ColorPicker` | 颜色选择器 |
| `SliderControl` | 滑块控件 |
| `ToggleSwitch` | 开关控件 |
| `SelectControl` | 下拉选择器 |
| `EditableField` | 可编辑文本字段 |
| `CollapsibleSection` | 可折叠区域 |

**样式切换组件：**

| 组件 | 职责 |
|------|------|
| `ArrowStyleToggle` | 箭头样式切换（单/双） |
| `RectBorderStyleToggle` | 矩形边框样式（实线/虚线） |
| `FontStyleToggle` | 字体样式（正常/斜体） |
| `FontWeightToggle` | 字体粗细（正常/粗体） |
| `BackgroundPresetButton` | 背景预设按钮 |
| `ShadowPresetButton` | 阴影预设按钮 |
| `ImageShadowPresetButton` | 图片阴影预设按钮 |

### 6. 基础层

| 文件 | 职责 | 行数 |
|------|------|------|
| `types.ts` | 类型定义 | 262 |
| `constants.ts` | 常量定义 | 276 |

**核心类型：**

```typescript
// 图形类型
type ToolId = 'select' | 'move' | 'arrow' | 'rect' | 'text' | 'mosaic' | 'crop'
interface ArrowShape { id, startX, startY, endX, endY, color, strokeWidth, headSize, style }
interface RectShape { id, x, y, width, height, color, strokeWidth, fillOpacity, borderStyle }
interface TextShape { id, x, y, text, color, fontSize, fontWeight, fontStyle }
interface MosaicShape { id, x, y, width, height, blockSize, opacity }
interface CropArea { x, y, width, height }

// 状态类型
interface EditorState { arrows, rects, texts, mosaics, imageData, view, selectedIds... }
interface ImageFrameSettings { background, padding, borderRadius, shadow, watermark }

// 拖拽类型
type DragType = 'none' | 'move' | 'start' | 'end' | 'middle'
type RectDragType = 'none' | 'move' | 'resize-tl' | 'resize-tr' | ...
```

**核心常量：**

```typescript
// 尺寸限制
MIN_SCALE = 0.25, MAX_SCALE = 4
MAX_IMG_W = 800, MAX_IMG_H = 600

// 预设
PRESET_COLORS: string[]
BACKGROUND_PRESETS: BackgroundPreset[]
SHADOW_PRESETS: ShadowPreset[]
BORDER_RADIUS_PRESETS: BorderRadiusPreset[]
ASPECT_RATIO_PRESETS: AspectRatioPreset[]

// 默认样式
DEFAULT_ARROW_STYLE, DEFAULT_RECT_STYLE, DEFAULT_TEXT_STYLE, DEFAULT_MOSAIC_STYLE
DEFAULT_FRAME_SETTINGS: ImageFrameSettings
```

## 数据流

```
用户操作
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  App.tsx 事件处理                                            │
│  - 鼠标事件 → 图形绘制/选择/拖拽                              │
│  - 键盘事件 → 快捷键/删除/撤销恢复                            │
│  - 拖放事件 → 图片上传                                        │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  useEditorStore Actions                                      │
│  - setArrows / addArrow / updateArrow / deleteArrow         │
│  - setRects / addRect / updateRect / deleteRect             │
│  - setActiveTool / setScale / setOffset                     │
│  - setImageData / setFrameSettings                          │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Zustand Store State Update                                  │
│  - 触发订阅组件重渲染                                         │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Canvas Renderer                                             │
│  - 读取最新状态 → 重绘 Canvas                                │
│  - drawArrow / drawRect / drawText / drawMosaic             │
└─────────────────────────────────────────────────────────────┘
```

## 依赖关系

```
App.tsx
├── store/editor-store.ts
│   ├── types.ts
│   └── constants.ts
├── services/canvas-renderer.ts
│   ├── types.ts
│   └── constants.ts
├── utils/
│   ├── editor.ts
│   └── shape-helpers.ts
│       └── types.ts
├── hooks/
│   ├── useEditorHistory.ts → types.ts
│   ├── useZoomPan.ts → constants.ts
│   └── useExport.ts
│       ├── services/canvas-renderer.ts
│       └── utils/editor.ts
└── components/
    ├── Toolbar → store/editor-store.ts
    ├── PropertiesPanel
    │   ├── store/editor-store.ts
    │   └── components/* (UI 控件)
    ├── FrameSettings → store/editor-store.ts
    ├── CanvasImage → services/canvas-renderer.ts
    └── WatermarkRenderer
```

## 外部依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| `zustand` | - | 状态管理 |
| `react` | - | UI 框架 |
| `lucide-react` | - | 图标库 |
| `react-i18next` | - | 国际化 |
| `@zumer/snapdom` | - | DOM 截图导出 |

## 测试覆盖

| 模块 | 测试文件 | 状态 |
|------|----------|------|
| Store | `store/__tests__/editor-store.test.ts` | ✅ |
| Canvas Renderer | `services/__tests__/canvas-renderer.test.ts` | ✅ |
| Shape Helpers | `utils/__tests__/shape-helpers.test.ts` | ✅ |

**测试覆盖率：** ≥ 60%

## 重构成果

| 指标 | 重构前 | 重构后 | 变化 |
|------|--------|--------|------|
| App.tsx 行数 | 5989 | 2153 | -64% |
| 模块数量 | 1 | 30+ | +2900% |
| 状态管理 | useState | Zustand | 现代化 |
| 测试覆盖 | 0% | ≥60% | +60% |
| 组件复用性 | 低 | 高 | 提升 |

## 相关文档

- [重构任务清单](../../openspec/changes/refactor-editor-modular/tasks.md)
- [功能设计文档](../03-functional-design-document.md)

---

*此代码地图由自动化脚本生成，反映代码库实际状态。如有变更请及时更新。*
