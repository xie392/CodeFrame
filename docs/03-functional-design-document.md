# CodeFrame 功能设计文档

## 一、文档信息

| 项目 | 内容 |
|------|------|
| **产品名称** | CodeFrame - 代码美化截图工具 |
| **版本** | v1.0.0 |
| **文档状态** | 草稿 |
| **创建日期** | 2026-03-27 |

---

## 二、系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CodeFrame Extension Architecture                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        用户界面层 (UI Layer)                         │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │   │
│  │  │  Popup    │  │  Editor   │  │  CodeGen  │  │  Options  │        │   │
│  │  │  主弹窗   │  │  图片编辑器│  │  代码生成器│  │  设置页   │        │   │
│  │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘        │   │
│  └────────┼──────────────┼──────────────┼──────────────┼───────────────┘   │
│           │              │              │              │                    │
│           ▼              ▼              ▼              ▼                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     业务逻辑层 (Business Layer)                      │   │
│  │  ┌───────────────────────────────────────────────────────────────┐ │   │
│  │  │                    Service Worker (background.js)              │ │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │ │   │
│  │  │  │消息路由 │ │存储管理 │ │缓存管理 │ │导出队列 │ │事件监听 │ │ │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │ │   │
│  │  └───────────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│           │              │              │              │                    │
│           ▼              ▼              ▼              ▼                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      内容脚本层 (Content Scripts)                    │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │   │
│  │  │ Screenshot│  │  Canvas   │  │  Overlay  │  │  Selector │        │   │
│  │  │ 截图脚本  │  │ 画布处理  │  │ 遮罩层    │  │ 元素选择  │        │   │
│  │  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘        │   │
│  └────────┼──────────────┼──────────────┼──────────────┼───────────────┘   │
│           │              │              │              │                    │
│           ▼              ▼              ▼              ▼                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       数据存储层 (Storage Layer)                     │   │
│  │  ┌───────────────────────┐  ┌───────────────────────────────┐      │   │
│  │  │   chrome.storage.local │  │        IndexedDB              │      │   │
│  │  │   配置/设置 (≤10MB)    │  │     截图历史/缓存 (大容量)    │      │   │
│  │  └───────────────────────┘  └───────────────────────────────┘      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈选型

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| **构建工具** | Vite + CRXJS | 原生支持 Chrome 扩展 HMR |
| **UI 框架** | React 18 + TypeScript | 类型安全，生态成熟 |
| **样式方案** | TailwindCSS + CSS Variables | 快速开发 + 主题切换 |
| **代码高亮** | Shiki | VS Code 同款引擎，高亮精准 |
| **DOM 转图片** | html-to-image | 现代实现，SVG/CORS 支持完善 |
| **Canvas 操作** | Konva.js | 高性能 Canvas 框架 |
| **状态管理** | Zustand | 轻量级，适合 Chrome 扩展 |
| **存储方案** | chrome.storage + IndexedDB | 小数据用 Storage，大文件用 IndexedDB |

---

## 三、模块设计

### 3.1 模块结构图

```
codeframe-extension/
├── manifest.json                    # 扩展清单 (Manifest V3)
├── public/
│   ├── icons/                       # 扩展图标
│   └── themes/                      # 预设主题
├── src/
│   ├── background/                  # Service Worker
│   │   ├── index.ts                 # 入口
│   │   ├── message-router.ts        # 消息路由
│   │   ├── storage-manager.ts       # 存储管理
│   │   └── context-menu.ts          # 右键菜单
│   │
│   ├── popup/                       # 主弹窗
│   │   ├── App.tsx
│   │   └── components/
│   │       ├── QuickActions.tsx     # 快捷操作
│   │       ├── CodeInput.tsx        # 代码输入
│   │       └── Preview.tsx          # 预览区
│   │
│   ├── editor/                      # 图片编辑器
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── Toolbar.tsx
│   │   │   ├── Canvas.tsx
│   │   │   └── AnnotationLayer.tsx
│   │   └── tools/
│   │       ├── arrow.ts
│   │       ├── text.ts
│   │       └── blur.ts
│   │
│   ├── codegen/                     # 代码生成器
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── CodeEditor.tsx
│   │   │   ├── ThemePanel.tsx
│   │   │   └── ExportPanel.tsx
│   │   └── lib/
│   │       ├── highlighter.ts
│   │       └── themes/
│   │
│   ├── content/                     # 内容脚本
│   │   ├── screenshot.ts
│   │   ├── selector.ts
│   │   └── overlay.ts
│   │
│   ├── shared/                      # 共享模块
│   │   ├── constants.ts
│   │   ├── types.ts
│   │   ├── messages.ts
│   │   └── utils/
│   │       ├── image.ts
│   │       └── download.ts
│   │
│   └── options/                     # 设置页
│       └── App.tsx
│
├── vite.config.ts
└── package.json
```

### 3.2 核心模块设计

#### 3.2.1 截图捕获模块

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          截图捕获模块设计                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        ScreenshotCapture                             │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  属性:                                                               │   │
│  │  - mode: 'region' | 'visible' | 'fullpage' | 'desktop' | 'delayed' │   │
│  │  - delay: number                                                    │   │
│  │  - quality: number                                                  │   │
│  │  - format: 'png' | 'jpg' | 'webp'                                   │   │
│  │                                                                      │   │
│  │  方法:                                                               │   │
│  │  + capture(): Promise<ImageData>                                    │   │
│  │  + selectRegion(): Promise<Region>                                  │   │
│  │  + scrollAndStitch(): Promise<ImageData>                            │   │
│  │  + captureDesktop(): Promise<ImageData>                             │   │
│  │  + startDelayedCapture(delay: number): void                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  数据流:                                                                     │
│                                                                              │
│  用户触发 → Background 接收消息 → Content Script 执行                       │
│       ↓                                                                      │
│  捕获屏幕/选区 → 生成 ImageData → 返回 Editor 页面                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**关键实现逻辑：**

```typescript
// 截图捕获核心流程
interface CaptureOptions {
  mode: 'region' | 'visible' | 'fullpage' | 'desktop' | 'delayed';
  delay?: number;
  quality?: number;
  format?: 'png' | 'jpg' | 'webp';
}

class ScreenshotCapture {
  async capture(options: CaptureOptions): Promise<ImageData> {
    switch (options.mode) {
      case 'region':
        return this.captureRegion();
      case 'visible':
        return this.captureVisible();
      case 'fullpage':
        return this.captureFullPage();
      case 'desktop':
        return this.captureDesktop();
      case 'delayed':
        return this.captureWithDelay(options.delay);
    }
  }

  // 整页截图实现
  private async captureFullPage(): Promise<ImageData> {
    // 1. 获取页面高度
    // 2. 分段截图
    // 3. Canvas 拼接
    // 4. 返回完整图片
  }
}
```

#### 3.2.2 图片标注模块

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          图片标注模块设计                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        AnnotationManager                             │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  属性:                                                               │   │
│  │  - annotations: Annotation[]                                        │   │
│  │  - activeTool: ToolType                                             │   │
│  │  - history: AnnotationHistory                                       │   │
│  │                                                                      │   │
│  │  方法:                                                               │   │
│  │  + addAnnotation(annotation: Annotation): void                      │   │
│  │  + updateAnnotation(id: string, props: Partial<Annotation>): void   │   │
│  │  + deleteAnnotation(id: string): void                               │   │
│  │  + undo(): void                                                     │   │
│  │  + redo(): void                                                     │   │
│  │  + render(ctx: CanvasRenderingContext2D): void                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  标注类型定义:                                                               │
│                                                                              │
│  type Annotation =                                                          │
│    | ArrowAnnotation                                                        │
│    | RectangleAnnotation                                                    │
│    | CircleAnnotation                                                       │
│    | TextAnnotation                                                         │
│    | BlurAnnotation                                                         │
│    | PenAnnotation                                                          │
│    | WatermarkAnnotation;                                                   │
│                                                                              │
│  interface BaseAnnotation {                                                 │
│    id: string;                                                              │
│    type: AnnotationType;                                                    │
│    x: number;                                                               │
│    y: number;                                                               │
│    opacity: number;                                                         │
│    rotation: number;                                                        │
│  }                                                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**标注工具类型：**

```typescript
// 标注类型定义
type AnnotationType = 
  | 'arrow'      // 箭头
  | 'rectangle'  // 矩形
  | 'circle'     // 圆形
  | 'text'       // 文字
  | 'blur'       // 马赛克
  | 'pen'        // 画笔
  | 'watermark'; // 水印

interface ArrowAnnotation extends BaseAnnotation {
  type: 'arrow';
  endX: number;
  endY: number;
  color: string;
  strokeWidth: number;
  arrowStyle: 'simple' | 'double' | 'rounded';
}

interface BlurAnnotation extends BaseAnnotation {
  type: 'blur';
  width: number;
  height: number;
  blurLevel: number; // 1-10
}
```

#### 3.2.3 代码美化模块 ★核心★

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          代码美化模块设计                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        CodeBeautifier                                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  属性:                                                               │   │
│  │  - code: string                                                     │   │
│  │  - language: string                                                 │   │
│  │  - theme: CodeTheme                                                 │   │
│  │  - background: BackgroundStyle                                      │   │
│  │  - windowStyle: WindowStyle                                         │   │
│  │  - options: BeautifyOptions                                         │   │
│  │                                                                      │   │
│  │  方法:                                                               │   │
│  │  + setCode(code: string): void                                      │   │
│  │  + detectLanguage(): string                                         │   │
│  │  + highlight(): HighlightedCode                                     │   │
│  │  + applyTheme(theme: CodeTheme): void                               │   │
│  │  + setBackground(style: BackgroundStyle): void                      │   │
│  │  + setWindowStyle(style: WindowStyle): void                         │   │
│  │  + highlightLines(lines: number[]): void                            │   │
│  │  + render(): HTMLElement                                            │   │
│  │  + export(format: ExportFormat): Promise<Blob>                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  数据流:                                                                     │
│                                                                              │
│  代码输入 → 语言检测 → 语法高亮 → 应用主题 → 渲染预览 → 导出图片             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**核心配置类型：**

```typescript
// 代码美化配置
interface BeautifyOptions {
  // 字体设置
  fontFamily: string;      // 'Fira Code' | 'JetBrains Mono' | ...
  fontSize: number;        // 12-32
  lineHeight: number;      // 1.0-2.0
  
  // 行号设置
  showLineNumbers: boolean;
  startLineNumber: number;
  
  // 窗口设置
  windowStyle: 'macos' | 'windows' | 'none';
  windowTitle: string;
  showWindowTitle: boolean;
  
  // 边距设置
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  
  // 效果设置
  borderRadius: number;    // 0-24
  shadowEnabled: boolean;
  shadowBlur: number;
  shadowColor: string;
  
  // 高亮设置
  highlightLines: number[];
  highlightStyle: 'background' | 'border' | 'glow';
  highlightColor: string;
}

// 背景样式
interface BackgroundStyle {
  type: 'solid' | 'gradient' | 'image';
  value: string | GradientDefinition | ImageDefinition;
}

interface GradientDefinition {
  type: 'linear' | 'radial';
  colors: Array<{ color: string; position: number }>;
  angle?: number;
}

// 代码主题
interface CodeTheme {
  id: string;
  name: string;
  type: 'light' | 'dark';
  colors: {
    background: string;
    text: string;
    keyword: string;
    string: string;
    number: string;
    comment: string;
    function: string;
    variable: string;
    operator: string;
  };
}
```

**渲染流程：**

```typescript
class CodeBeautifier {
  // 主渲染流程
  async render(): Promise<HTMLElement> {
    // 1. 创建容器元素
    const container = this.createContainer();
    
    // 2. 应用背景样式
    this.applyBackground(container);
    
    // 3. 创建代码窗口
    const window = this.createCodeWindow();
    
    // 4. 应用语法高亮
    const highlighted = await this.highlight();
    
    // 5. 应用行高亮
    this.applyLineHighlights(highlighted);
    
    // 6. 组装 DOM
    container.appendChild(window);
    window.appendChild(highlighted);
    
    return container;
  }
  
  // 导出图片
  async export(format: 'png' | 'jpg' | 'svg'): Promise<Blob> {
    const element = await this.render();
    
    if (format === 'svg') {
      return this.exportToSVG(element);
    }
    
    return htmlToImage.toBlob(element, {
      quality: 1,
      pixelRatio: 2, // 2x 高清
    });
  }
}
```

---

## 四、数据流设计

### 4.1 消息通信架构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          消息通信架构                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Popup                          Background                    Content       │
│     │                                │                            │         │
│     │  ──── CAPTURE_REQUEST ────►   │                            │         │
│     │                                │  ──── START_CAPTURE ────► │         │
│     │                                │                            │         │
│     │                                │  ◄─── CAPTURE_RESULT ──── │         │
│     │  ◄─── CAPTURE_IMAGE ───────   │                            │         │
│     │                                │                            │         │
│     │  ──── EDIT_IMAGE ──────────►   │                            │         │
│     │       (打开 Editor 页面)       │                            │         │
│     │                                │                            │         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 消息类型定义

```typescript
// 消息类型定义
type MessageType = 
  | 'CAPTURE_REQUEST'      // 请求截图
  | 'CAPTURE_RESULT'       // 截图结果
  | 'EDIT_IMAGE'           // 编辑图片
  | 'GENERATE_CODE'        // 生成代码截图
  | 'EXPORT_IMAGE'         // 导出图片
  | 'SAVE_SETTINGS'        // 保存设置
  | 'GET_SETTINGS';        // 获取设置

interface Message<T = unknown> {
  type: MessageType;
  payload: T;
  timestamp: number;
}

// 截图请求消息
interface CaptureRequestPayload {
  mode: 'region' | 'visible' | 'fullpage' | 'desktop' | 'delayed';
  delay?: number;
  quality?: number;
}

// 截图结果消息
interface CaptureResultPayload {
  success: boolean;
  imageData?: string; // base64
  error?: string;
}
```

### 4.3 状态管理

```typescript
// 全局状态定义 (Zustand)
interface AppState {
  // 截图状态
  screenshot: {
    image: ImageData | null;
    mode: CaptureMode;
    status: 'idle' | 'capturing' | 'editing' | 'exporting';
  };
  
  // 标注状态
  annotation: {
    activeTool: AnnotationType;
    annotations: Annotation[];
    history: AnnotationHistory;
  };
  
  // 代码生成状态
  codegen: {
    code: string;
    language: string;
    theme: CodeTheme;
    background: BackgroundStyle;
    options: BeautifyOptions;
  };
  
  // 设置状态
  settings: {
    defaultFormat: 'png' | 'jpg' | 'webp';
    defaultQuality: number;
    shortcuts: ShortcutConfig;
    language: 'zh-CN' | 'en';
  };
  
  // Actions
  actions: {
    captureScreenshot: (mode: CaptureMode) => Promise<void>;
    addAnnotation: (annotation: Annotation) => void;
    updateAnnotation: (id: string, props: Partial<Annotation>) => void;
    deleteAnnotation: (id: string) => void;
    setCode: (code: string) => void;
    setTheme: (theme: CodeTheme) => void;
    exportImage: (format: ExportFormat) => Promise<void>;
  };
}
```

---

## 五、存储设计

### 5.1 存储方案

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          存储方案设计                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  chrome.storage.local (≤10MB)                                               │
│  ├── settings: UserSettings           // 用户设置                           │
│  ├── recentCodes: RecentCodeItem[]    // 最近代码片段                       │
│  ├── customThemes: CustomTheme[]      // 自定义主题                         │
│  └── shortcuts: ShortcutConfig        // 快捷键配置                         │
│                                                                              │
│  IndexedDB (大容量)                                                          │
│  ├── screenshots: ScreenshotRecord    // 截图历史                           │
│  ├── templates: Template              // 用户模板                           │
│  └── cache: CacheItem                 // 缓存数据                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 数据模型

```typescript
// 用户设置
interface UserSettings {
  defaultFormat: 'png' | 'jpg' | 'webp';
  defaultQuality: number;
  language: 'zh-CN' | 'en';
  shortcuts: ShortcutConfig;
  codeTheme: string;
  annotationDefaults: AnnotationDefaults;
}

// 截图历史记录
interface ScreenshotRecord {
  id: string;
  imageData: Blob;
  createdAt: Date;
  annotations: Annotation[];
  source: 'capture' | 'codegen';
  tags: string[];
}

// 代码片段记录
interface RecentCodeItem {
  id: string;
  code: string;
  language: string;
  theme: string;
  createdAt: Date;
}

// 用户模板
interface Template {
  id: string;
  name: string;
  type: 'code' | 'annotation';
  config: BeautifyOptions | AnnotationConfig;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 六、API 接口设计

### 6.1 截图 API

```typescript
// 截图服务接口
interface ScreenshotService {
  /**
   * 区域截图
   * @returns 截图数据
   */
  captureRegion(): Promise<ImageData>;
  
  /**
   * 可视区域截图
   */
  captureVisible(): Promise<ImageData>;
  
  /**
   * 整页截图
   */
  captureFullPage(): Promise<ImageData>;
  
  /**
   * 桌面截图
   */
  captureDesktop(): Promise<ImageData>;
  
  /**
   * 延迟截图
   * @param delay 延迟时间（秒）
   */
  captureDelayed(delay: number): Promise<ImageData>;
}
```

### 6.2 标注 API

```typescript
// 标注服务接口
interface AnnotationService {
  /**
   * 添加标注
   */
  add(annotation: Omit<Annotation, 'id'>): Annotation;
  
  /**
   * 更新标注
   */
  update(id: string, props: Partial<Annotation>): void;
  
  /**
   * 删除标注
   */
  delete(id: string): void;
  
  /**
   * 撤销
   */
  undo(): void;
  
  /**
   * 重做
   */
  redo(): void;
  
  /**
   * 导出带标注的图片
   */
  exportWithAnnotations(imageData: ImageData): Promise<Blob>;
}
```

### 6.3 代码美化 API

```typescript
// 代码美化服务接口
interface CodeBeautifierService {
  /**
   * 设置代码
   */
  setCode(code: string): void;
  
  /**
   * 检测语言
   */
  detectLanguage(): Promise<string>;
  
  /**
   * 设置语言
   */
  setLanguage(language: string): void;
  
  /**
   * 设置主题
   */
  setTheme(themeId: string): void;
  
  /**
   * 设置背景
   */
  setBackground(style: BackgroundStyle): void;
  
  /**
   * 设置窗口样式
   */
  setWindowStyle(style: WindowStyle): void;
  
  /**
   * 高亮指定行
   */
  highlightLines(lines: number[], color?: string): void;
  
  /**
   * 预览
   */
  preview(): HTMLElement;
  
  /**
   * 导出
   */
  export(format: ExportFormat, options?: ExportOptions): Promise<Blob>;
}
```

### 6.4 导出 API

```typescript
// 导出服务接口
interface ExportService {
  /**
   * 导出为 PNG
   */
  exportPNG(imageData: ImageData, quality?: number): Promise<Blob>;
  
  /**
   * 导出为 JPG
   */
  exportJPG(imageData: ImageData, quality?: number): Promise<Blob>;
  
  /**
   * 导出为 WEBP
   */
  exportWEBP(imageData: ImageData, quality?: number): Promise<Blob>;
  
  /**
   * 导出为 SVG
   */
  exportSVG(element: HTMLElement): Promise<Blob>;
  
  /**
   * 复制到剪贴板
   */
  copyToClipboard(blob: Blob): Promise<void>;
  
  /**
   * 下载文件
   */
  download(blob: Blob, filename: string): void;
}
```

---

## 七、性能优化

### 7.1 代码分割策略

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          代码分割策略                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  入口文件 (必须同步加载)                                                      │
│  ├── popup.js (~50KB)                                                       │
│  ├── background.js (~30KB)                                                  │
│  └── content.js (~20KB)                                                     │
│                                                                              │
│  按需加载模块                                                                 │
│  ├── editor.js (~200KB) - 打开编辑器时加载                                   │
│  ├── codegen.js (~150KB) - 打开代码生成器时加载                              │
│  ├── shiki-worker.js (~500KB) - 代码高亮时加载                               │
│  └── konva.js (~100KB) - Canvas 操作时加载                                   │
│                                                                              │
│  预加载策略                                                                   │
│  ├── 用户首次点击插件图标时预加载 editor.js                                   │
│  └── 用户进入代码模式时预加载 shiki-worker.js                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 图片处理优化

| 优化点 | 策略 |
|--------|------|
| 大图压缩 | 导出前自动压缩，保持画质 |
| Canvas 分层 | 标注层与原图分离，减少重绘 |
| 懒加载 | 历史列表虚拟滚动 |
| 缓存 | 主题、字体资源缓存 |

---

## 八、安全设计

### 8.1 权限设计

```json
{
  "permissions": [
    "activeTab",       // 仅当前标签页
    "storage",         // 本地存储
    "contextMenus",    // 右键菜单
    "clipboardWrite"   // 写入剪贴板
  ],
  "optional_permissions": [
    "desktopCapture"   // 桌面截图（可选）
  ]
}
```

### 8.2 内容安全策略

```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self' data:;
  worker-src 'self' blob:;
```

### 8.3 数据安全

| 安全措施 | 描述 |
|----------|------|
| 本地处理 | 所有图片处理在本地完成 |
| 无网络请求 | 不发送任何数据到服务器 |
| 敏感信息保护 | 不存储密码、Token 等敏感信息 |
| 安全存储 | IndexedDB 数据加密存储 |

---

## 九、测试策略

### 9.1 单元测试

| 测试范围 | 工具 | 覆盖率要求 |
|----------|------|------------|
| 工具函数 | Vitest | ≥ 80% |
| 状态管理 | Vitest | ≥ 80% |
| API 接口 | Vitest | ≥ 80% |

### 9.2 集成测试

| 测试范围 | 工具 |
|----------|------|
| 消息通信 | Puppeteer |
| 截图功能 | Puppeteer |
| 导出功能 | Puppeteer |

### 9.3 E2E 测试

| 测试场景 | 验证点 |
|----------|--------|
| 截图流程 | 触发 → 选区 → 编辑 → 导出 |
| 代码生成流程 | 输入 → 美化 → 导出 |
| 标注流程 | 添加 → 编辑 → 删除 → 导出 |

---

*文档版本：v1.0.0*
*最后更新：2026年3月27日*
