# 项目 上下文

## 目的

**CodeFrame** 是一款面向开发者、设计师、内容创作者的 Chrome 扩展，提供两大核心功能：

1. **代码转图片**：将代码片段转换为美观的截图，支持语法高亮、多种主题风格
2. **截图美化**：将任意截图自动美化，添加背景、设备边框等

品牌标语：Frame your code, frame your screenshots.

### 目标用户

- 开发者：代码展示、GitHub README、博客
- 设计师：作品集展示、App界面演示
- 技术博主：社交媒体内容创作
- 产品经理：产品演示、汇报材料
- 讲师/教程作者：制作教程素材

## 技术栈

### 框架层
- **WXT** - Chrome Extension Framework（Manifest V3）
- **SolidJS** - 响应式 UI 框架
- **TypeScript** - 类型安全

### 构建层
- **Vite** - 构建工具
- **pnpm** - 包管理器

### 样式层
- **Tailwind CSS** - 原子化 CSS 框架

### 功能层
- **highlight.js** - 代码语法高亮
- **Canvas API** - 图像渲染
- **html-to-image** - DOM 转图片

### 服务层
- **Lemon Squeezy** - 支付/许可证管理
- **chrome.storage.sync** - 用户数据同步存储

## 项目约定

### 代码风格

- **语言**：TypeScript 严格模式
- **命名约定**：
  - 变量/函数：camelCase（如 `userName`, `getUserById`）
  - 常量：UPPER_SNAKE_CASE（如 `MAX_EXPORT_SIZE`）
  - 类/接口/类型/组件：PascalCase（如 `CodeEditor`, `ScreenshotStore`）
  - 文件名：kebab-case（如 `code-editor.tsx`）
  - 私有成员：`_` 前缀（如 `_internalState`）
- **函数设计**：单一职责，纯函数优先，圈复杂度 ≤ 5
- **单行长度**：≤ 80 字符
- **格式化**：使用 ESLint + Prettier

### 架构模式

```
项目结构：
├── entrypoints/          # WXT 入口点
│   ├── popup/            # 主弹窗
│   ├── options/          # 设置页
│   ├── background.ts     # Service Worker
│   └── content.ts        # 内容脚本
├── components/           # SolidJS 组件
│   ├── ui/               # 基础 UI 组件
│   ├── code/             # 代码转图片模块
│   ├── screenshot/       # 截图美化模块
│   ├── export/           # 导出模块
│   └── payment/          # 付费模块
├── hooks/                # SolidJS Hooks
├── stores/               # 状态管理
└── utils/                # 工具函数
```

**架构原则**：
- 组件化开发，每个组件单一职责
- 状态管理使用 SolidJS Signals
- Pro 功能通过 `useProStatus` Hook 统一控制
- 配置数据使用 JSON 文件管理（themes.json, backgrounds.json）

### 测试策略

- **单元测试**：核心工具函数（license 验证、canvas 处理）
- **集成测试**：付费流程、导出流程
- **E2E 测试**：关键用户路径（代码转图片、截图美化）
- **测试覆盖率目标**：≥ 80%

### Git工作流

- **分支策略**：
  - `main` - 生产分支
  - `develop` - 开发分支
  - `feature/*` - 功能分支
  - `fix/*` - 修复分支
- **提交约定**：遵循 Conventional Commits
  - `feat:` 新功能
  - `fix:` Bug 修复
  - `docs:` 文档更新
  - `refactor:` 重构
  - `chore:` 构建/工具变更

## 领域上下文

### 付费模式

```
免费版：
├── 5 个代码主题
├── 3 种背景
├── 有水印
├── 最大分辨率 1920x1080
└── 每天截图美化限 3 次

Pro 版（$9.99 一次性买断）：
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

### 设备边框

| 设备 | 类型 | Pro专属 |
|------|------|---------|
| MacBook Pro | 免费 | 否 |
| Browser Window | 免费 | 否 |
| MacBook Air | Pro | 是 |
| iMac | Pro | 是 |
| iPhone 15/15 Pro | Pro | 是 |
| iPad Pro | Pro | 是 |

### 社交平台尺寸预设

- Twitter Post (1200x675)
- Twitter Header (1500x500)
- LinkedIn Post (1200x627)
- Instagram Square (1080x1080)
- Instagram Story (1080x1920)
- YouTube Thumbnail (1280x720)
- Open Graph (1200x630)

## 重要约束

### 技术约束

- 扩展包大小 < 1MB
- 弹窗打开时间 < 200ms
- 代码转图片处理 < 1s
- 截图处理 < 2s
- 内存占用 < 100MB

### 浏览器兼容性

| 平台 | 最低版本 |
|------|----------|
| Chrome | 88+ |
| Edge | 88+ |
| Brave | 最新 |
| Arc | 最新 |

### Chrome Extension 权限

```json
{
  "permissions": [
    "activeTab",
    "storage",
    "clipboardWrite",
    "tabs"
  ],
  "host_permissions": [
    "https://api.lemonsqueezy.com/*"
  ]
}
```

### 业务约束

- License 激活限制：3 台设备
- 每日 License 验证缓存：24 小时
- 免费版水印必须显示

## 外部依赖

### Lemon Squeezy API

- **用途**：支付处理、许可证验证
- **文档**：https://docs.lemonsqueezy.com/api
- **产品配置**：
  - 价格：$9.99
  - 类型：一次性购买
  - 启用 License Key

### highlight.js

- **用途**：代码语法高亮
- **文档**：https://highlightjs.org/
- **支持语言**：javascript, typescript, python, java, go, rust, c, cpp, csharp, php, ruby, swift, kotlin, html, css, scss, sql, json, yaml, markdown, bash, shell, dockerfile, graphql, vue, react

### 技术文档参考

- WXT 文档：https://wxt.dev/
- SolidJS 文档：https://www.solidjs.com/
- Tailwind CSS：https://tailwindcss.com/
- Chrome Extension API：https://developer.chrome.com/docs/extensions/
