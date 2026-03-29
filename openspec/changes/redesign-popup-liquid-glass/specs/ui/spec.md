## MODIFIED Requirements

### Requirement: UI 设计系统

CodeFrame MUST 使用液态玻璃（Liquid Glass）设计风格，为开发者提供精致、现代、通透的用户体验。系统 MUST 支持明暗双主题，所有 UI 基础组件 MUST 基于 shadcn/ui 构建，通过 HSL CSS Variables 实现主题定制。

#### Scenario: 颜色系统（暗色主题）

- **当** 用户处于暗色主题
- **那么** 背景色 MUST 为 hsl(222 47% 6%)（深海蓝 #0B1120）
- **且** 前景文字色 MUST 为 hsl(210 40% 96%)（#F1F5F9）
- **且** 主色 MUST 为 hsl(217 91% 60%)（#3B82F6 蓝色）
- **且** 卡片背景 MUST 使用半透明毛玻璃效果
- **且** 边框 MUST 使用半透明细线

#### Scenario: 颜色系统（亮色主题）

- **当** 用户处于亮色主题
- **那么** 背景色 MUST 为 hsl(210 20% 97%)（#F5F7FA 冷灰白）
- **且** 前景文字色 MUST 为 hsl(222 47% 11%)（#1E293B）
- **且** 主色 MUST 保持 hsl(217 91% 60%)（#3B82F6）
- **且** 卡片背景 MUST 使用白色半透明毛玻璃效果
- **且** 文字对比度 MUST 达到 WCAG 4.5:1 标准

#### Scenario: 字体系统

- **当** 用户查看标题或按钮
- **那么** 字体 MUST 为 Space Grotesk
- **当** 用户查看正文或描述
- **那么** 字体 MUST 为 DM Sans

#### Scenario: 玻璃卡片样式

- **当** 用户查看操作按钮卡片
- **那么** 圆角 MUST 为 12px
- **且** 背景 MUST 使用 backdrop-filter: blur(12px) saturate(180%)
- **且** 暗色主题背景 MUST 为 rgba(255,255,255,0.08)
- **且** 亮色主题背景 MUST 为 rgba(255,255,255,0.6)
- **且** 边框 MUST 为 1px 半透明细线

#### Scenario: 交互动画

- **当** 用户悬停在可交互元素上
- **那么** MUST 有 scale(1.02) 微缩放效果
- **且** 过渡时间 MUST 为 200ms
- **且** 过渡曲线 MUST 为 ease
- **且** MUST 尊重 prefers-reduced-motion 偏好

## ADDED Requirements

### Requirement: 双主题系统

CodeFrame MUST 支持明暗双主题切换，通过 CSS class 方式实现，主题偏好 MUST 持久化存储。

#### Scenario: 主题切换

- **当** 用户切换主题
- **那么** 页面 MUST 平滑过渡到目标主题（duration 300ms）
- **且** 主题偏好 MUST 保存到 chrome.storage.local

#### Scenario: 主题持久化

- **当** 用户重新打开扩展 Popup
- **那么** MUST 自动应用上次选择的主题
- **且** 页面加载时 MUST 无主题闪烁（通过内联脚本预设置 class）

#### Scenario: 玻璃效果工具类

- **当** 开发者需要应用玻璃效果
- **那么** MUST 提供 `.glass` 工具类
- **且** `.glass` MUST 包含 backdrop-filter: blur(12px) saturate(180%)
- **且** MUST 同时支持暗色和亮色主题
