## ADDED Requirements

### Requirement: shadcn/ui 组件库集成

CodeFrame MUST 集成 shadcn/ui 作为 UI 基础组件库，所有新增 UI 组件 MUST 优先使用 shadcn/ui 组件，组件代码 MUST 存放于 `src/shared/components/ui/` 目录。

#### Scenario: 组件库初始化

- **当** 开发者需要在项目中添加新的 UI 组件
- **那么** 必须优先使用 shadcn/ui 组件（如 Button、Dialog、Select、Tabs 等）
- **且** 组件文件必须存放于 `src/shared/components/ui/` 目录下
- **且** 组件必须通过 `@shared/components/ui/*` 路径别名引用

#### Scenario: 主题一致性

- **当** 使用 shadcn/ui 组件
- **那么** 组件必须使用项目的 CSS Variables 主题系统（暗色模式 + 绿色主色调）
- **且** 组件样式必须与现有设计风格保持一致

#### Scenario: Chrome 扩展兼容

- **当** 项目构建为 Chrome 扩展
- **那么** 所有 shadcn/ui 组件必须与 Manifest V3 CSP 兼容
- **且** 禁止使用 `eval()` 或内联脚本

## MODIFIED Requirements

### Requirement: UI 设计系统

CodeFrame MUST 使用现代科技风格（Bento Grid + Glassmorphism），为开发者提供精致、现代的用户体验。UI 基础组件 MUST 基于 shadcn/ui 构建，通过 CSS Variables 实现主题定制。

#### Scenario: 颜色系统

- **当** 用户查看任何界面
- **那么** 主色调必须为 #3B82F6（蓝色）
- **且** 背景色必须为 #0F172A（深蓝黑）
- **且** 文字色必须为 #F1F5F9（浅灰白）
- **且** 边框色必须为 #334155（深灰蓝）
- **且** 颜色值必须通过 shadcn/ui 兼容的 HSL CSS Variables 定义

#### Scenario: 字体系统

- **当** 用户查看标题或按钮
- **那么** 字体必须为 Space Grotesk
- **当** 用户查看正文或描述
- **那么** 字体必须为 DM Sans

#### Scenario: 卡片样式

- **当** 用户查看操作按钮卡片
- **那么** 圆角必须为 12px
- **且** 背景必须使用 rgba(255,255,255,0.05) + backdrop-blur
- **且** 必须有柔和阴影

#### Scenario: 交互动画

- **当** 用户悬停在可交互元素上
- **那么** 必须有 scale(1.02) 效果
- **且** 过渡时间必须为 200ms
- **且** 过渡曲线必须为 ease
