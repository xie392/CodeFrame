# CodeFrame - 产品需求文档 (PRD)

> 版本：2.0.0
> 更新日期：2026-03-27
> 产品类型：Chrome扩展 - 代码转图片 + 截图美化工具
> 技术栈：WXT + SolidJS + Tailwind CSS
> 品牌标语：Frame your code, frame your screenshots.

---

## 一、产品概述

### 1.1 产品定位

**CodeFrame** 是一款面向开发者、设计师、内容创作者的Chrome扩展，提供两大核心功能：

1. **代码转图片**：将代码片段转换为美观的截图
2. **截图美化**：将任意截图自动美化，添加背景、设备边框等

### 1.2 目标用户

| 用户群体 | 使用场景 | 付费意愿 |
|----------|----------|----------|
| 开发者 | 代码展示、GitHub README、博客 | 高 |
| 设计师 | 作品集展示、App界面演示 | 高 |
| 技术博主 | 社交媒体内容创作 | 高 |
| 产品经理 | 产品演示、汇报材料 | 中 |
| 讲师/教程作者 | 制作教程素材 | 高 |

### 1.3 核心价值

```
代码转图片：
├── 一键美化代码，多种主题风格
├── 支持多语言语法高亮
└── 适合博客、文档、社交媒体

截图美化：
├── 自动添加精美背景
├── 添加设备边框（Mac/iPhone/Browser）
├── 一键适配社交平台尺寸
└── 适合产品展示、作品集
```

### 1.4 商业模式

```
免费版：
├── 5个代码主题
├── 3种背景
├── 有水印
├── 最大分辨率 1920x1080
└── 每天截图美化限3次

Pro版（$9.99 一次性买断，品牌：CodeFrame Pro）：
├── 20+ 代码主题
├── 所有背景和渐变
├── 所有设备边框（iPhone/iPad/iMac）
├── 无水印导出
├── 4K 高清导出
├── 自定义背景上传
├── 无限截图美化
├── 批量导出
├── 配置预设保存
└── 终身免费更新
```

---

## 二、功能需求

### 2.1 功能架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CodeFrame 功能架构                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────┐     ┌─────────────────────────┐              │
│   │     📝 代码转图片        │     │     📸 截图美化          │              │
│   ├─────────────────────────┤     ├─────────────────────────┤              │
│   │ • 代码输入/粘贴         │     │ • 捕获当前页面          │              │
│   │ • 语法高亮              │     │ • 上传本地图片          │              │
│   │ • 主题选择              │     │ • 添加背景              │              │
│   │ • 背景设置              │     │ • 设备边框              │              │
│   │ • 窗口样式              │     │ • 尺寸裁剪              │              │
│   │ • 导出图片              │     │ • 阴影/圆角             │              │
│   └─────────────────────────┘     └─────────────────────────┘              │
│                    │                           │                           │
│                    └───────────┬───────────────┘                           │
│                                │                                           │
│                    ┌───────────▼───────────┐                               │
│                    │     📤 统一导出        │                               │
│                    ├───────────────────────┤                               │
│                    │ • PNG / WebP / SVG    │                               │
│                    │ • 复制到剪贴板         │                               │
│                    │ • 下载到本地          │                               │
│                    │ • 多分辨率导出        │                               │
│                    └───────────────────────┘                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 功能列表

| 模块 | 功能 | 优先级 | Pro专属 |
|------|------|--------|---------|
| **代码转图片** | 代码输入与语法高亮 | P0 | 否 |
| | 语言自动检测 | P0 | 否 |
| | 主题选择（5+20） | P0 | 部分是 |
| | 背景设置 | P0 | 部分是 |
| | 窗口样式 | P1 | 否 |
| | 显示行号 | P0 | 否 |
| | 字体大小调整 | P1 | 否 |
| **截图美化** | 捕获当前标签页 | P0 | 否 |
| | 上传本地图片 | P0 | 否 |
| | 背景渐变 | P0 | 部分是 |
| | 设备边框（Mac/iPhone） | P0 | 部分是 |
| | 浏览器窗口边框 | P0 | 否 |
| | 圆角调整 | P1 | 否 |
| | 阴影调整 | P1 | 否 |
| | 尺寸预设（Twitter/LinkedIn） | P1 | 否 |
| | 自定义背景上传 | P1 | 是 |
| | 批量处理 | P2 | 是 |
| **导出** | PNG导出 | P0 | 否 |
| | WebP导出 | P1 | 是 |
| | SVG导出 | P2 | 是 |
| | 复制到剪贴板 | P0 | 否 |
| | 多分辨率导出 | P1 | 是 |
| | 无水印 | P0 | 是 |
| **付费系统** | License激活 | P0 | - |
| | Pro功能解锁 | P0 | - |
| | 配置预设保存 | P2 | 是 |

### 2.3 代码转图片 - 详细设计

#### 2.3.1 代码输入区

```
┌─────────────────────────────────────────────────────────────────┐
│  代码输入                                                        │
│                                                                  │
│  语言: [自动检测 ▼]  [✓] 显示行号  字号: [16px ▼]               │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  1│ function calculateTotal(items) {                       │ │
│  │  2│   return items.reduce((sum, item) => {                 │ │
│  │  3│     return sum + item.price * item.quantity;           │ │
│  │  4│   }, 0);                                               │ │
│  │  5│ }                                                      │ │
│  │  6│                                                        │ │
│  │   │                                                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [清空] [粘贴] [格式化]                                          │
└─────────────────────────────────────────────────────────────────┘
```

**支持语言（优先）**：
```json
[
  "javascript", "typescript", "python", "java", "go", "rust",
  "c", "cpp", "csharp", "php", "ruby", "swift", "kotlin",
  "html", "css", "scss", "sql", "json", "yaml", "markdown",
  "bash", "shell", "dockerfile", "graphql", "vue", "react"
]
```

#### 2.3.2 主题选择

| 主题名称 | 类型 | Pro专属 |
|----------|------|---------|
| GitHub Light | 免费 | 否 |
| GitHub Dark | 免费 | 否 |
| One Dark Pro | 免费 | 否 |
| Dracula | 免费 | 否 |
| Monokai | 免费 | 否 |
| Nord | Pro | 是 |
| Material Oceanic | Pro | 是 |
| Tokyo Night | Pro | 是 |
| Catppuccin | Pro | 是 |
| Gruvbox | Pro | 是 |
| Solarized Dark | Pro | 是 |
| Ayu Mirage | Pro | 是 |
| VS Code Dark+ | Pro | 是 |
| Night Owl | Pro | 是 |
| Synthwave 84 | Pro | 是 |
| ... (共20+) | | |

#### 2.3.3 背景与窗口样式

```
背景类型：
├── 纯色：白色、浅灰、深灰（免费）
├── 渐变：Sunset、Ocean、Galaxy、Aurora...（Pro）
└── 自定义：上传图片（Pro）

窗口样式：
├── macOS（红黄绿按钮）
├── Windows 11
├── Linux Gnome
└── 无边框
```

### 2.4 截图美化 - 详细设计

#### 2.4.1 图片来源

```
方式一：捕获当前标签页
├── 点击扩展图标
├── 选择"截图美化"
├── 自动捕获当前可见区域
└── 或选择"全页面截图"

方式二：上传本地图片
├── 拖拽图片到扩展窗口
├── 或点击上传按钮
└── 支持 PNG/JPG/WebP
```

#### 2.4.2 设备边框

| 设备 | Pro专属 | 说明 |
|------|---------|------|
| MacBook Pro | 否 | 支持调整角度 |
| Browser Window | 否 | 地址栏可编辑 |
| 无边框 | 否 | - |
| MacBook Air | 是 | - |
| iMac | 是 | - |
| iPhone 15 | 是 | 多种颜色 |
| iPhone 15 Pro | 是 | - |
| iPad Pro | 是 | - |
| Android Phone | 是 | - |

#### 2.4.3 背景与效果

```
背景选择：
├── 纯色（免费3种 + Pro 10种）
├── 渐变（Pro 20种）
├── 图片背景（Pro可上传）
└── 透明背景

效果调整：
├── 圆角：0-50px
├── 阴影：无/小/中/大/超大
├── 缩放：50%-200%
├── 旋转：0-30°
└── 位置：居中/左上/右上...
```

#### 2.4.4 尺寸预设

```
社交平台尺寸：
├── Twitter Post (1200x675)
├── Twitter Header (1500x500)
├── LinkedIn Post (1200x627)
├── Instagram Square (1080x1080)
├── Instagram Story (1080x1920)
├── YouTube Thumbnail (1280x720)
├── Open Graph (1200x630)
└── 自定义尺寸
```

#### 2.4.5 截图美化界面

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📸 截图美化                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────────────────────────────┐│
│  │   图片来源            │  │                  预览区域                    ││
│  │                      │  │                                              ││
│  │  [捕获当前页]         │  │   ┌────────────────────────────────────┐   ││
│  │  [全页截图]           │  │   │     🖥️ MacBook 边框                │   ││
│  │  [上传图片]           │  │   │   ┌──────────────────────────┐     │   ││
│  │                      │  │   │   │                          │     │   ││
│  │  ─────────────────   │  │   │   │    [你的截图内容]        │     │   ││
│  │                      │  │   │   │                          │     │   ││
│  │   设备边框            │  │   │   └──────────────────────────┘     │   ││
│  │  ┌────┐ ┌────┐      │  │   │                                     │   ││
│  │  │ 💻 │ │ 📱 │ 🔒   │  │   │        🌅 渐变背景                  │   ││
│  │  │Mac │ │iPhone│     │  │   │                                     │   ││
│  │  └────┘ └────┘      │  │   └────────────────────────────────────┘   ││
│  │  ┌────┐ ┌────┐      │  │                                              ││
│  │  │ 🖥️ │ │ 📟 │ 🔒   │  │                                              ││
│  │  │iMac│ │iPad│      │  │                                              ││
│  │  └────┘ └────┘      │  │                                              ││
│  │                      │  └──────────────────────────────────────────────┘│
│  │   背景                │                                                │
│  │  ┌───┐┌───┐┌───┐    │  ┌──────────────────────────────────────────────┐│
│  │  │ ⬜││ 🔘││ ⬛│    │  │  效果调整                                    ││
│  │  └───┘└───┘└───┘    │  │                                              ││
│  │  ┌───┐┌───┐┌───┐    │  │  圆角: [━━━━━━━━○] 12px                     ││
│  │  │ 🌅││ 🌊││ 🌌│🔒  │  │  阴影: [━━━━━━━━○] 中                        ││
│  │  └───┘└───┘└───┘    │  │  缩放: [━━━━━━━━○] 100%                      ││
│  │                      │  │  尺寸: [Twitter Post ▼] 1200x675            ││
│  │  [上传自定义背景]🔒  │  │                                              ││
│  │                      │  └──────────────────────────────────────────────┘│
│  └──────────────────────┘                                                  │
│                                                                              │
│  [📋 复制]  [⬇️ 下载 PNG]  [⬇️ 下载 WebP]🔒  [💎 升级Pro]                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.5 付费系统

#### 2.5.1 升级弹窗

```
┌─────────────────────────────────────────────────────────────────┐
│                    ✨ 升级到 Pro 版本                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │     解锁全部功能，让你的截图更出色                           │ │
│  │                                                             │ │
│  │     代码转图片：                                            │ │
│  │     ✅ 20+ 精美主题                                         │ │
│  │     ✅ 所有渐变背景                                         │ │
│  │     ✅ 自定义背景上传                                       │ │
│  │                                                             │ │
│  │     截图美化：                                              │ │
│  │     ✅ 所有设备边框（iPhone/iPad/iMac）                     │ │
│  │     ✅ 20+ 渐变背景                                         │ │
│  │     ✅ 自定义背景上传                                       │ │
│  │     ✅ 无限截图美化                                         │ │
│  │                                                             │ │
│  │     导出：                                                  │ │
│  │     ✅ 无水印导出                                           │ │
│  │     ✅ 4K 高清导出                                          │ │
│  │     ✅ WebP/SVG 格式                                        │ │
│  │     ✅ 批量导出 + 预设保存                                  │ │
│  │     ✅ 终身免费更新                                         │ │
│  │                                                             │ │
│  │                    $9.99                                    │ │
│  │               一次性购买，永久使用                           │ │
│  │                                                             │ │
│  │     ┌─────────────────────────────────────────────────┐   │ │
│  │     │              🚀 立即升级                         │   │ │
│  │     └─────────────────────────────────────────────────┘   │ │
│  │                                                             │ │
│  │     已有 License Key? [点击激活]                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 三、技术架构

### 3.1 技术栈

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              技术栈架构                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   框架层：WXT (Chrome Extension Framework) + SolidJS                        │
│   构建层：Vite + TypeScript                                                 │
│   样式层：Tailwind CSS                                                      │
│   功能层：highlight.js + Canvas API + html-to-image                         │
│   服务层：Lemon Squeezy (支付) + chrome.storage.sync (存储)                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 项目结构（WXT + SolidJS）

```
codeframe/
├── wxt.config.ts              # WXT 配置
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
│
├── public/
│   ├── icon/                  # 扩展图标
│   │   ├── 16.png
│   │   ├── 48.png
│   │   └── 128.png
│   └── devices/               # 设备边框素材
│       ├── macbook-pro.png
│       ├── macbook-air.png
│       ├── iphone-15.png
│       └── ...
│
├── assets/
│   ├── themes.json            # 代码主题配置
│   ├── backgrounds.json       # 背景配置
│   └── devices.json           # 设备边框配置
│
├── components/                # SolidJS 组件
│   ├── ui/                    # 基础UI组件
│   │   ├── Button.tsx
│   │   ├── Select.tsx
│   │   ├── Slider.tsx
│   │   ├── Modal.tsx
│   │   └── Tabs.tsx
│   ├── code/                  # 代码转图片模块
│   │   ├── CodeEditor.tsx
│   │   ├── ThemeSelector.tsx
│   │   ├── BackgroundPicker.tsx
│   │   ├── WindowStyle.tsx
│   │   └── CodePreview.tsx
│   ├── screenshot/            # 截图美化模块
│   │   ├── ImageSource.tsx
│   │   ├── DeviceFrame.tsx
│   │   ├── BackgroundSelector.tsx
│   │   ├── EffectControls.tsx
│   │   ├── SizePresets.tsx
│   │   └── ScreenshotPreview.tsx
│   ├── export/                # 导出模块
│   │   ├── ExportButton.tsx
│   │   ├── FormatSelector.tsx
│   │   └── ResolutionPicker.tsx
│   └── payment/               # 付费模块
│       ├── UpgradeModal.tsx
│       ├── ActivatePage.tsx
│       └── ProBadge.tsx
│
├── hooks/                     # SolidJS Hooks
│   ├── useProStatus.ts
│   ├── useStorage.ts
│   └── useCanvas.ts
│
├── stores/                    # 状态管理
│   ├── codeStore.ts
│   ├── screenshotStore.ts
│   └── settingsStore.ts
│
├── utils/                     # 工具函数
│   ├── license.ts             # License验证
│   ├── storage.ts             # 存储封装
│   ├── canvas.ts              # Canvas工具
│   ├── export.ts              # 导出工具
│   └── highlight.ts           # 代码高亮
│
├── entrypoints/               # WXT 入口点
│   ├── popup/                 # 主弹窗
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   └── style.css
│   ├── options/               # 设置页
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   └── style.css
│   ├── background.ts          # Service Worker
│   └── content.ts             # 内容脚本（可选）
│
└── .wxt/                      # WXT 缓存（自动生成）
```

### 3.3 WXT 配置文件

```typescript:wxt.config.ts
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-solid'],
  
  manifest: {
    name: 'CodeFrame - Code & Screenshot Beautifier',
    description: 'Frame your code beautifully. Transform code into stunning screenshots and beautify any screenshot with device frames.',
    version: '1.0.0',
    
    permissions: [
      'activeTab',
      'storage',
      'clipboardWrite',
      'tabs',
    ],
    
    host_permissions: [
      'https://api.lemonsqueezy.com/*',
    ],
    
    action: {
      default_popup: 'popup/index.html',
    },
    
    options_page: 'options/index.html',
  },
  
  dev: {
    server: {
      port: 3000,
    },
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
```

### 3.4 核心组件代码

#### 3.4.1 主应用入口

```tsx:entrypoints/popup/App.tsx
import { createSignal } from 'solid-js';
import { Tabs, Tab } from '~/components/ui/Tabs';
import CodePanel from '~/components/code/CodePanel';
import ScreenshotPanel from '~/components/screenshot/ScreenshotPanel';
import UpgradeModal from '~/components/payment/UpgradeModal';
import { useProStatus } from '~/hooks/useProStatus';

export default function App() {
  const [activeTab, setActiveTab] = createSignal('code');
  const [showUpgrade, setShowUpgrade] = createSignal(false);
  const { isPro } = useProStatus();

  return (
    <div class="w-[800px] h-[600px] bg-white">
      {/* Header */}
      <header class="flex items-center justify-between px-4 py-3 border-b">
        <div class="flex items-center gap-2">
          <img src="/icon/48.png" class="w-8 h-8" />
          <span class="font-bold text-lg">CodeSnap Pro</span>
          {isPro() && <ProBadge />}
        </div>
        <button 
          class="text-gray-500 hover:text-gray-700"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          ⚙️
        </button>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab()} onChange={setActiveTab}>
        <Tab value="code">📝 代码转图片</Tab>
        <Tab value="screenshot">📸 截图美化</Tab>
      </Tabs>

      {/* Content */}
      <main class="p-4">
        {activeTab() === 'code' && (
          <CodePanel onUpgrade={() => setShowUpgrade(true)} />
        )}
        {activeTab() === 'screenshot' && (
          <ScreenshotPanel onUpgrade={() => setShowUpgrade(true)} />
        )}
      </main>

      {/* Upgrade Modal */}
      <UpgradeModal 
        show={showUpgrade()} 
        onClose={() => setShowUpgrade(false)} 
      />
    </div>
  );
}
```

#### 3.4.2 截图捕获组件

```tsx:components/screenshot/ImageSource.tsx
import { createSignal } from 'solid-js';

interface Props {
  onImageReady: (imageData: string) => void;
}

export default function ImageSource(props: Props) {
  const [isLoading, setIsLoading] = createSignal(false);

  // 捕获当前标签页
  const captureVisibleTab = async () => {
    setIsLoading(true);
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: 'png',
        quality: 100,
      });
      props.onImageReady(dataUrl);
    } catch (error) {
      console.error('Capture failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 上传本地图片
  const handleUpload = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        props.onImageReady(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div class="flex flex-col gap-2">
      <button 
        class="btn-primary"
        onClick={captureVisibleTab}
        disabled={isLoading()}
      >
        {isLoading() ? '捕获中...' : '📷 捕获当前页面'}
      </button>
      
      <button class="btn-secondary" onClick={() => document.getElementById('upload-input')?.click()}>
        📁 上传本地图片
      </button>
      
      <input 
        id="upload-input"
        type="file" 
        accept="image/*" 
        class="hidden"
        onChange={handleUpload}
      />
    </div>
  );
}
```

#### 3.4.3 设备边框组件

```tsx:components/screenshot/DeviceFrame.tsx
import { For } from 'solid-js';
import { useProStatus } from '~/hooks/useProStatus';

const DEVICES = [
  { id: 'macbook-pro', name: 'MacBook Pro', icon: '💻', isPro: false },
  { id: 'browser', name: 'Browser', icon: '🌐', isPro: false },
  { id: 'none', name: '无边框', icon: '⬜', isPro: false },
  { id: 'macbook-air', name: 'MacBook Air', icon: '💻', isPro: true },
  { id: 'imac', name: 'iMac', icon: '🖥️', isPro: true },
  { id: 'iphone-15', name: 'iPhone 15', icon: '📱', isPro: true },
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro', icon: '📱', isPro: true },
  { id: 'ipad-pro', name: 'iPad Pro', icon: '📟', isPro: true },
];

interface Props {
  selected: string;
  onSelect: (deviceId: string) => void;
  onUpgrade: () => void;
}

export default function DeviceFrame(props: Props) {
  const { isPro } = useProStatus();

  const handleSelect = (device: typeof DEVICES[0]) => {
    if (device.isPro && !isPro()) {
      props.onUpgrade();
      return;
    }
    props.onSelect(device.id);
  };

  return (
    <div class="grid grid-cols-4 gap-2">
      <For each={DEVICES}>
        {(device) => (
          <button
            class={`p-2 rounded-lg border-2 transition-all ${
              props.selected === device.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            } ${device.isPro && !isPro() ? 'opacity-60' : ''}`}
            onClick={() => handleSelect(device)}
          >
            <div class="text-2xl">{device.icon}</div>
            <div class="text-xs mt-1">{device.name}</div>
            {device.isPro && !isPro() && <div class="text-xs">🔒</div>}
          </button>
        )}
      </For>
    </div>
  );
}
```

#### 3.4.4 Pro 状态 Hook

```tsx:hooks/useProStatus.ts
import { createSignal, createEffect } from 'solid-js';
import { validateLicense } from '~/utils/license';

export function useProStatus() {
  const [isPro, setIsPro] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(true);

  createEffect(async () => {
    const { isPro: stored, licenseKey } = await chrome.storage.sync.get(['isPro', 'licenseKey']);
    
    if (!licenseKey) {
      setIsPro(false);
      setIsLoading(false);
      return;
    }

    const lastCheck = await getLastCheckTime();
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;

    if (now - lastCheck > ONE_DAY) {
      const result = await validateLicense(licenseKey);
      setIsPro(result.success);
      await chrome.storage.sync.set({ isPro: result.success });
      await setLastCheckTime(now);
    } else {
      setIsPro(stored || false);
    }
    
    setIsLoading(false);
  });

  return { isPro, isLoading };
}

async function getLastCheckTime(): Promise<number> {
  const { lastLicenseCheck } = await chrome.storage.sync.get(['lastLicenseCheck']);
  return lastLicenseCheck || 0;
}

async function setLastCheckTime(time: number): Promise<void> {
  await chrome.storage.sync.set({ lastLicenseCheck: time });
}
```

### 3.5 主题配置文件

```json:assets/themes.json
{
  "themes": [
    {
      "id": "github-light",
      "name": "GitHub Light",
      "type": "light",
      "isPro": false,
      "colors": {
        "background": "#ffffff",
        "text": "#24292e",
        "keyword": "#d73a49",
        "string": "#032f62",
        "comment": "#6a737d",
        "function": "#6f42c1",
        "number": "#005cc5"
      }
    },
    {
      "id": "one-dark-pro",
      "name": "One Dark Pro",
      "type": "dark",
      "isPro": false,
      "colors": {
        "background": "#282c34",
        "text": "#abb2bf",
        "keyword": "#c678dd",
        "string": "#98c379",
        "comment": "#5c6370",
        "function": "#61afef",
        "number": "#d19a66"
      }
    },
    {
      "id": "nord",
      "name": "Nord",
      "type": "dark",
      "isPro": true,
      "colors": {
        "background": "#2e3440",
        "text": "#d8dee9",
        "keyword": "#81a1c1",
        "string": "#a3be8c",
        "comment": "#616e88",
        "function": "#88c0d0",
        "number": "#b48ead"
      }
    }
  ]
}
```

### 3.6 背景配置文件

```json:assets/backgrounds.json
{
  "solidColors": [
    { "id": "white", "name": "White", "value": "#ffffff", "isPro": false },
    { "id": "gray-100", "name": "Light Gray", "value": "#f3f4f6", "isPro": false },
    { "id": "gray-900", "name": "Dark Gray", "value": "#1f2937", "isPro": false }
  ],
  
  "gradients": [
    {
      "id": "sunset",
      "name": "Sunset",
      "value": "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      "isPro": true
    },
    {
      "id": "ocean",
      "name": "Ocean",
      "value": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "isPro": true
    },
    {
      "id": "forest",
      "name": "Forest",
      "value": "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
      "isPro": true
    },
    {
      "id": "galaxy",
      "name": "Galaxy",
      "value": "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      "isPro": true
    },
    {
      "id": "aurora",
      "name": "Aurora",
      "value": "linear-gradient(135deg, #00c6fb 0%, #005bea 100%)",
      "isPro": true
    }
  ]
}
```

---

## 四、数据存储设计

### 4.1 存储结构

```typescript
interface StorageData {
  // Pro 状态
  isPro: boolean;
  licenseKey: string;
  licenseData: LicenseData | null;
  lastLicenseCheck: number;

  // 用户配置
  settings: {
    code: {
      defaultLanguage: string;
      showLineNumbers: boolean;
      defaultTheme: string;
      defaultBackground: string;
      defaultWindowStyle: string;
      fontSize: number;
    };
    screenshot: {
      defaultDevice: string;
      defaultBackground: string;
      defaultRadius: number;
      defaultShadow: string;
      defaultSize: string;
    };
    export: {
      resolution: string;
      scale: number;
      format: 'png' | 'webp' | 'svg';
      addWatermark: boolean;
    };
  };

  // 预设（Pro功能）
  presets: Preset[];

  // 统计
  stats: {
    codeExports: number;
    screenshotExports: number;
    createdAt: number;
  };
}
```

---

## 五、开发计划

### 5.1 版本规划

| 版本 | 功能 | 周期 |
|------|------|------|
| v1.0.0 | 代码转图片 + 基础截图美化 + 付费系统 | 3周 |
| v1.1.0 | 设备边框 + 渐变背景 + 尺寸预设 | 1周 |
| v1.2.0 | 批量处理 + 预设保存 | 1周 |
| v2.0.0 | 云同步 + 更多设备 | 待定 |

### 5.2 v1.0.0 详细任务

#### 第1周：基础框架 + 代码转图片

```
Day 1-2: 项目初始化
├── pnpm create wxt codesnap-pro
├── 配置 SolidJS + Tailwind CSS
├── 创建基础组件（Button、Select等）
└── 搭建主界面布局

Day 3-4: 代码转图片核心
├── 代码编辑器组件
├── 语法高亮集成
├── 主题系统
└── 背景系统

Day 5-7: 导出 + 预览
├── Canvas 渲染
├── 图片导出
├── 复制到剪贴板
└── 水印系统
```

#### 第2周：截图美化功能

```
Day 8-9: 截图捕获
├── 标签页捕获
├── 本地上传
└── 图片处理

Day 10-11: 设备边框
├── 设备边框素材
├── 边框渲染
└── 效果调整（圆角、阴影）

Day 12-14: 尺寸预设 + 导出
├── 社交平台尺寸
├── 自定义尺寸
└── 多格式导出
```

#### 第3周：付费系统 + 发布

```
Day 15-17: 付费系统
├── Lemon Squeezy 集成
├── License 验证
├── 激活页面
└── Pro 功能解锁

Day 18-19: 测试优化
├── 功能测试
├── 性能优化
└── Bug 修复

Day 20-21: 发布准备
├── Chrome Store 素材
├── 描述文案
├── 提交审核
└── Landing Page
```

---

## 六、发布清单

### 6.1 Chrome Web Store

```
必需素材：
├── 图标：16x16、48x48、128x128 PNG
├── 宣传图：1280x800 PNG
├── 截图：至少1张，最多5张（1280x800）
└── 隐私政策 URL

描述文案：
├── 标题：CodeFrame - Code & Screenshot Beautifier
├── 简短描述（132字符内）
└── 详细描述（2000字符内）
```

### 6.2 支付页面（Lemon Squeezy）

```
产品设置：
├── 产品名称：CodeFrame
├── 价格：$9.99
├── 类型：一次性购买
├── 启用 License Key
└── 设置激活限制（3台设备）
```

---

## 七、质量要求

### 7.1 性能指标

| 指标 | 目标 |
|------|------|
| 扩展包大小 | < 1MB |
| 弹窗打开时间 | < 200ms |
| 代码转图片 | < 1s |
| 截图处理 | < 2s |
| 内存占用 | < 100MB |

### 7.2 兼容性

| 平台 | 版本 |
|------|------|
| Chrome | 88+ |
| Edge | 88+ |
| Brave | 最新 |
| Arc | 最新 |

---

## 附录

### A. 技术文档链接

- WXT 文档：https://wxt.dev/
- SolidJS 文档：https://www.solidjs.com/
- Tailwind CSS：https://tailwindcss.com/
- highlight.js：https://highlightjs.org/
- Lemon Squeezy API：https://docs.lemonsqueezy.com/api
- Chrome Extension API：https://developer.chrome.com/docs/extensions/

### B. 竞品参考

| 产品 | 网址 | 值得学习 |
|------|------|----------|
| Ray.so | https://ray.so | 简洁UI、流畅交互 |
| Carbon | https://carbon.now.sh | 开源、功能全面 |
| Pika | https://pika.rvious.com | 截图美化 |
| Screenshot.one | https://screenshot.one | 设备边框 |

---

*文档结束*

---

## 使用提示

将本文档提供给 AI 时，可添加以下指令：

```
请根据以上 PRD 文档，使用 WXT + SolidJS 开发 CodeFrame Chrome 扩展。

开发顺序：
1. 初始化项目：pnpm create wxt codeframe
2. 安装依赖：pnpm add @wxt-dev/module-solid tailwindcss
3. 创建基础 UI 组件
4. 实现「代码转图片」模块
5. 实现「截图美化」模块
6. 实现付费系统
7. 测试和优化

每完成一个步骤向我确认再继续。
```
