# 项目上下文

## 目的

CodeFrame 是一款对标 ShotEasy 的 Chrome 浏览器插件，核心新增"代码输入转美化截图"功能。

**产品愿景**：打造一款集截图标注与代码美化于一体的 Chrome 浏览器插件，让开发者、设计师、内容创作者能够快速生成高质量的代码截图和标注图片，提升内容创作效率。

**核心价值**：
- 一站式解决方案：截图捕获 + 图片标注 + 代码美化 三合一
- 超越竞品体验：对标 ShotEasy 截图功能，超越 Carbon/Ray.so 代码美化体验
- 本地优先：所有处理在本地完成，保护隐私，无需登录

---

## 技术栈

### 前端框架
- **React 19** - UI 组件开发
- **TypeScript** - 类型安全

### 构建工具
- **Vite** - 快速构建
- **CRXJS** - Chrome 扩展 HMR 支持

### 样式方案
- **TailwindCSS** - 原子化 CSS
- **CSS Variables** - 主题切换

### 核心库
| 功能 | 技术 | 说明 |
|------|------|------|
| 代码高亮 | Shiki | VS Code 同款引擎，支持 180+ 语言 |
| DOM 转图片 | html-to-image | SVG/CORS 支持完善 |
| Canvas 操作 | LeaferJS | 高性能 Canvas 框架（已从 Konva.js 迁移） |
| 状态管理 | Zustand | 轻量级，适合 Chrome 扩展 |

### 存储方案
- **chrome.storage.local** - 配置、设置 (≤10MB)
- **IndexedDB** - 截图历史、缓存 (大容量)

### 扩展规范
- **Chrome Extension Manifest V3** - Chrome 88+ 强制要求

---

## 项目约定

### 代码风格

```yaml
命名规范:
  变量/函数: camelCase        # getUserById, userName
  常量: UPPER_SNAKE_CASE     # MAX_RETRY_COUNT, API_BASE_URL
  组件/类型: PascalCase       # UserService, UserProfile
  文件名: kebab-case          # user-profile-card.tsx
  私有成员: _前缀             # _internalState

TypeScript:
  严格模式: true
  无 any 类型
  接口优于类型别名

代码质量:
  ESLint + Prettier
  单行长度 ≤ 80 字符
  圈复杂度 ≤ 5
```

### 架构模式

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CodeFrame 架构                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   用户界面层 (UI Layer)                                                      │
│   ├── Popup      - 主弹窗，快捷操作入口                                       │
│   ├── Editor     - 图片编辑器，标注功能                                       │
│   ├── CodeGen    - 代码生成器，美化功能                                       │
│   └── Options    - 设置页面                                                  │
│                                                                              │
│   业务逻辑层 (Business Layer)                                                 │
│   └── Service Worker (background.js)                                        │
│       ├── 消息路由                                                           │
│       ├── 存储管理                                                           │
│       ├── 缓存管理                                                           │
│       └── 事件监听                                                           │
│                                                                              │
│   内容脚本层 (Content Scripts)                                                │
│   ├── Screenshot - 截图捕获逻辑                                              │
│   ├── Selector   - 元素选择器                                                │
│   └── Overlay    - 遮罩层 UI                                                 │
│                                                                              │
│   数据存储层 (Storage Layer)                                                 │
│   ├── chrome.storage.local - 配置/设置                                      │
│   └── IndexedDB            - 截图历史/缓存                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**通信模式**：消息驱动 (chrome.runtime.sendMessage)

**数据处理**：本地优先，所有图片处理在本地完成

### 模块结构

```
src/
├── background/     # Service Worker
├── popup/          # 主弹窗
├── editor/         # 图片编辑器
├── codegen/        # 代码生成器
├── content/        # 内容脚本
├── shared/         # 共享模块
└── options/        # 设置页
```

### 测试策略

| 测试类型 | 工具 | 覆盖率要求 | 说明 |
|----------|------|------------|------|
| 单元测试 | Vitest | ≥ 80% | 工具函数、状态管理、API |
| 集成测试 | Puppeteer | - | 消息通信、截图、导出 |
| E2E 测试 | Playwright | - | 完整用户流程 |

### Git 工作流

```yaml
分支策略:
  main: 生产分支，受保护
  dev: 开发分支
  feature/*: 功能分支
  fix/*: 修复分支
  refactor/*: 重构分支

提交规范:
  feat: 新功能
  fix: Bug 修复
  docs: 文档更新
  style: 代码格式
  refactor: 重构
  test: 测试
  chore: 构建/工具
```

---

## 领域上下文

### 核心功能模块

| 模块 | 优先级 | 功能点 |
|------|--------|--------|
| **截图捕获** | P0 | 区域截图、可视区域截图、整页截图 |
| **图片标注** | P0 | 箭头、矩形、文字、马赛克 |
| **代码美化** | P0 | 代码输入、语法高亮、主题选择、渐变背景 |
| **导出分享** | P0 | PNG/JPG/WEBP 导出、复制到剪贴板 |
| **图片编辑** | P1 | 裁剪、调整尺寸、翻转、旋转 |
| **历史管理** | P2 | 截图历史、预设模板 |

### 目标用户

| 用户群体 | 使用场景 | 核心需求 |
|----------|----------|----------|
| 开发者 | 技术博客、文档编写、代码分享 | 代码语法高亮、美观截图 |
| 设计师 | 界面标注、设计评审、素材制作 | 截图标注、箭头指引 |
| 内容创作者 | 社交媒体、教程制作、知识分享 | 快速截图、美化导出 |
| 产品经理 | 需求文档、竞品分析、原型标注 | 区域截图、文字标注 |

---

## 重要约束

### 技术约束

| 约束 | 要求 | 原因 |
|------|------|------|
| Manifest V3 | Chrome 88+ | Chrome 强制要求 |
| CSP | 禁止 eval()、内联脚本 | 安全限制 |
| 存储限制 | 默认 10MB | 扩展限制 |
| Service Worker | 按需唤醒 | 性能优化 |

### 业务约束

| 约束 | 说明 |
|------|------|
| 本地处理 | 所有图片处理在本地完成，不上传服务器 |
| 无需登录 | 无需注册账号，保护用户隐私 |
| 权限最小化 | 仅申请必要的浏览器权限 |

### 性能指标

| 指标 | 要求 |
|------|------|
| 插件启动时间 | < 500ms |
| 截图响应时间 | < 200ms |
| 图片导出时间 | < 2s (普通) / < 5s (长截图) |
| 代码渲染时间 | < 300ms |
| 内存占用 | < 100MB (空闲状态) |

### 兼容性

| 平台 | 版本要求 |
|------|----------|
| Chrome | 88+ |
| Edge | 88+ |
| Firefox | 支持 (WebExtensions) |
| 操作系统 | Windows / macOS / Linux |

---

## 外部依赖

### Chrome Extensions API

```json
{
  "permissions": [
    "activeTab",
    "storage",
    "contextMenus",
    "clipboardWrite"
  ],
  "optional_permissions": [
    "desktopCapture"
  ]
}
```

### 第三方库

| 库 | 版本 | 用途 |
|----|------|------|
| Shiki | latest | 代码语法高亮 |
| LeaferJS | ^2.0.8 | Canvas 操作 |
| html-to-image | latest | DOM 转图片 |
| Lucide Icons | latest | 图标库 |

### 字体

| 字体 | 用途 |
|------|------|
| JetBrains Mono | 导航、标题、按钮 |
| IBM Plex Mono | 描述性文字 |

---

## 设计系统

### 风格

Terminal Minimal Dashboard - 纯暗色终端风格

### 色彩

```yaml
背景:
  primary: "#0A0A0A"    # 页面背景
  secondary: "#0F0F0F"  # 表头、高亮
  tertiary: "#1F1F1F"   # 激活导航

文字:
  primary: "#FAFAFA"    # 主要文字
  secondary: "#6B7280"  # 次要文字
  tertiary: "#4B5563"   # 辅助文字

强调色:
  primary: "#10B981"    # Emerald 绿 - 主色调
  warning: "#F59E0B"    # Amber - 警告
  info: "#06B6D4"       # Cyan - 信息
  error: "#EF4444"      # Red - 错误

边框:
  primary: "#2a2a2a"    # 所有边框、分割线
```

### 字体

```yaml
主字体: JetBrains Mono
  - 导航、标题、按钮、标签

辅字体: IBM Plex Mono
  - 描述、正文、副标题

字体大小:
  - xs: 11px  - 辅助文字
  - sm: 12px  - 按钮、标签
  - base: 13px - 正文、导航
  - lg: 14px  - 小标题
  - xl: 16px  - 标题
  - 2xl: 20px - Logo
  - 3xl: 28px - 页面标题
```

### 视觉特征

- 零圆角 (0px)
- 无阴影
- 终端语法 UI 元素 (>, $, //, [])

---

## 版本规划

```yaml
v1.0.0 (MVP - 4周):
  截图捕获: 区域、可视区域、整页截图
  图片标注: 箭头、矩形、文字、马赛克
  代码美化: 代码输入、语法高亮、主题选择、渐变背景
  导出功能: PNG/JPG 导出、复制到剪贴板
  基础设置: 快捷键、语言切换

v1.1.0 (增强版 - 2周):
  桌面窗口截图、延迟截图
  更多标注工具（画笔、水印、Emoji）
  代码高亮行、窗口样式
  SVG 导出、透明背景

v1.2.0 (专业版 - 2周):
  代码动画效果（打字机、逐行显示）
  模板系统
  图片编辑（裁剪、旋转、滤镜）
  截图历史管理

v2.0.0 (创新版 - 4周):
  AI 配色推荐
  动画导出 (GIF/MP4)
  云端同步（可选）
  团队协作功能
```

---

## 参考文档

| 文档 | 路径 |
|------|------|
| 竞品分析 | `docs/01-shoteasy-feature-analysis.md` |
| 产品需求 | `docs/02-product-requirements-document.md` |
| 功能设计 | `docs/03-functional-design-document.md` |
| UI 设计 | `docs/04-ui-design-document.md` |
| UI 设计文件 | `codeframe-ui.pen` |
