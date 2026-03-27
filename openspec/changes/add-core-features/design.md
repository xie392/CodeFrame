# 设计文档：CodeFrame 核心功能

## 上下文

CodeFrame 是一款 Chrome 扩展，面向开发者、设计师和内容创作者，提供代码转图片和截图美化两大核心功能。项目使用 WXT 框架开发，采用 Manifest V3 规范，UI 使用 SolidJS 框架。

### 约束条件

- 扩展包大小 < 1MB
- 弹窗打开时间 < 200ms
- 代码转图片处理 < 1s
- 截图处理 < 2s
- 内存占用 < 100MB
- 支持 Chrome 88+, Edge 88+, Brave, Arc

### 利益相关者

- 开发者（主要用户）
- 设计师
- 技术博主
- 产品经理

## 目标 / 非目标

### 目标

- 提供简洁高效的代码转图片功能
- 提供专业的截图美化功能
- 实现 Pro 版本付费解锁机制
- 确保性能指标达标

### 非目标

- 不支持视频处理
- 不支持云同步（v1.0）
- 不支持团队协作功能
- 不支持移动端原生应用

## 决策

### 1. 框架选型

**决策**：使用 WXT + SolidJS

**理由**：
- WXT 是专为 Chrome 扩展设计的框架，支持 Manifest V3，开发体验优秀
- SolidJS 是细粒度响应式框架，性能优于 React，适合扩展场景
- TypeScript 提供类型安全

**替代方案**：
- CRXJS + Vue：Vue 生态成熟但 CRXJS 维护不如 WXT 活跃
- 原生 JavaScript：开发效率低，缺乏响应式能力

### 2. 代码高亮方案

**决策**：使用 highlight.js

**理由**：
- 支持语言丰富（25+ 语言）
- 主题多样，易于扩展
- 体积适中，可通过 tree-shaking 优化

**替代方案**：
- Prism.js：功能相似，但 highlight.js 社区更活跃
- Shiki：使用 VS Code 主题引擎，但体积较大

### 3. 图片导出方案

**决策**：使用 Canvas API + html-to-image

**理由**：
- Canvas API 原生支持，性能好
- html-to-image 支持多种格式导出
- 可以精确控制输出质量

### 4. 付费方案

**决策**：使用 Lemon Squeezy

**理由**：
- 支持 License Key 管理
- 支持一次性购买
- 无需商户账户
- 全球支付支持

**替代方案**：
- Gumroad：功能相似，但 Lemon Squeezy API 更友好
- Stripe：需要商户账户，配置复杂

### 5. 状态管理方案

**决策**：使用 SolidJS Signals + Stores

**理由**：
- Signals 是 SolidJS 原生响应式方案
- 无需额外状态管理库
- 细粒度更新，性能最优

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                      Chrome Extension                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Popup     │  │   Options   │  │   Background.ts     │  │
│  │   (UI)      │  │   (设置页)   │  │   (Service Worker)  │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │              │
│         └────────────────┼─────────────────────┘              │
│                          │                                    │
│  ┌───────────────────────▼────────────────────────────────┐  │
│  │                    SolidJS 组件层                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │  │
│  │  │  Code    │  │Screenshot│  │  Export  │  │ Payment │ │  │
│  │  │  Module  │  │  Module  │  │  Module  │  │ Module  │ │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │  │
│  └───────┼─────────────┼─────────────┼─────────────┼───────┘  │
│          │             │             │             │           │
│  ┌───────▼─────────────▼─────────────▼─────────────▼───────┐  │
│  │                    Hooks & Stores                        │  │
│  │  useProStatus | useStorage | useCanvas                   │  │
│  │  codeStore | screenshotStore | settingsStore             │  │
│  └────────────────────────┬────────────────────────────────┘  │
│                           │                                   │
│  ┌────────────────────────▼────────────────────────────────┐  │
│  │                    Utils & APIs                          │  │
│  │  license.ts | storage.ts | canvas.ts | export.ts        │  │
│  │  highlight.ts                                            │  │
│  └────────────────────────┬────────────────────────────────┘  │
│                           │                                   │
│  ┌────────────────────────▼────────────────────────────────┐  │
│  │                 Chrome APIs                              │  │
│  │  chrome.tabs | chrome.storage | chrome.clipboard        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 数据模型

### 存储数据结构

```typescript
interface StorageData {
  // Pro 状态
  isPro: boolean;
  licenseKey: string;
  licenseData: LicenseData | null;
  lastLicenseCheck: number;

  // 用户配置
  settings: {
    code: CodeSettings;
    screenshot: ScreenshotSettings;
    export: ExportSettings;
  };

  // 预设（Pro功能）
  presets: Preset[];

  // 统计
  stats: {
    codeExports: number;
    screenshotExports: number;
    screenshotDailyCount: number;
    lastScreenshotDate: string;
    createdAt: number;
  };
}
```

### 主题配置结构

```typescript
interface Theme {
  id: string;
  name: string;
  type: 'light' | 'dark';
  isPro: boolean;
  colors: {
    background: string;
    text: string;
    keyword: string;
    string: string;
    comment: string;
    function: string;
    number: string;
  };
}
```

## 风险 / 权衡

### 风险 1：扩展包体积超限

- **风险**：highlight.js 和设备边框图片可能导致包体积超过 1MB
- **缓解措施**：
  - 使用 tree-shaking 只引入需要的语言
  - 设备边框使用 SVG 而非 PNG
  - 使用 WebP 格式压缩图片资源

### 风险 2：性能不达标

- **风险**：弹窗打开或导出处理时间过长
- **缓解措施**：
  - 使用 SolidJS 细粒度更新
  - 懒加载非核心模块
  - 缓存计算结果

### 风险 3：License 验证失败

- **风险**：网络问题导致 License 验证失败
- **缓解措施**：
  - 本地缓存验证结果（24小时有效）
  - 提供离线模式提示
  - 重试机制

## 迁移计划

不适用（新项目）

## 待决问题

1. **多语言支持**：是否在 v1.0 支持国际化？
2. **批量导出**：具体实现方式（多文件 zip vs 单独下载）
3. **自定义主题**：是否允许用户创建自定义代码主题？
