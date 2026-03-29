## MODIFIED Requirements

### Requirement: Popup 页面布局

Popup 页面 MUST 按照液态玻璃（Liquid Glass）设计风格实现，MUST 支持明暗双主题，尺寸为 360px x 500px，包含四个主要区域：Header、Tab 导航、内容区域、Footer。

#### Scenario: 页面初始化（暗色主题）

- **当** 用户打开 Popup 页面且主题为暗色
- **那么** 页面必须显示完整的 Header、Tab 导航、内容区域、Footer
- **且** 页面背景必须为半透明毛玻璃效果（backdrop-filter: blur(12px)）
- **且** 默认主题必须为暗色

#### Scenario: 页面初始化（亮色主题）

- **当** 用户打开 Popup 页面且主题为亮色
- **那么** 页面必须显示完整的 Header、Tab 导航、内容区域、Footer
- **且** 页面背景必须为亮色毛玻璃效果
- **且** 文字颜色必须为深色以保证对比度

### Requirement: Header 区域

Header 区域 MUST 包含 Logo 和操作按钮，MUST 使用毛玻璃背景效果，高度 48px。

#### Scenario: Logo 显示

- **当** 用户查看 Header 区域
- **然后** Logo 必须显示为 SVG 图标 + "CodeFrame" 文字
- **且** Logo 图标颜色必须为主色（primary）
- **且** "CodeFrame" 文字必须使用 Space Grotesk 字体，font-weight 600

#### Scenario: 操作按钮

- **当** 用户查看 Header 右侧
- **然后** 必须显示主题切换按钮（Sun/Moon 图标）和 Settings 图标
- **且** 按钮必须使用毛玻璃样式（半透明背景 + 圆角）
- **且** 悬停时必须有背景亮度变化过渡（duration 200ms）

#### Scenario: 主题切换

- **当** 用户点击主题切换按钮
- **然后** 页面必须在明暗主题之间切换
- **且** 切换必须有平滑的过渡动画（duration 300ms）
- **且** 主题偏好必须持久化到 chrome.storage.local

### Requirement: Tab 导航

Tab 导航 MUST 使用 shadcn/ui Tabs 组件实现，MUST 支持三个 Tab（screenshot、code、local），MUST 使用毛玻璃背景。

#### Scenario: Tab 活动状态

- **当** Tab 处于活动状态
- **然后** 活动 Tab 必须有主色（primary）高亮指示
- **且** 活动 Tab 背景必须为半透明高亮

#### Scenario: Tab 非活动状态

- **当** Tab 处于非活动状态
- **然后** Tab 文字颜色必须为弱化色（muted-foreground）
- **且** 悬停时必须有背景亮度过渡

#### Scenario: Tab 切换

- **当** 用户点击非活动 Tab
- **然后** 该 Tab 必须切换为活动状态
- **且** 之前活动的 Tab 必须切换为非活动状态
- **且** 内容区域必须平滑过渡显示对应内容

### Requirement: 截图操作按钮

内容区域 MUST 包含 5 个截图操作按钮，MUST 按 3+2 网格布局排列，MUST 使用液态玻璃卡片样式。

#### Scenario: 按钮布局

- **当** 用户查看内容区域
- **然后** 必须显示两行按钮
- **且** 第一行必须有 3 个按钮（region、visible、fullpage）
- **且** 第二行必须有 2 个按钮（desktop、delayed）
- **且** 按钮之间间距必须为 12px

#### Scenario: 按钮样式

- **当** 用户查看任意操作按钮
- **然后** 按钮必须使用毛玻璃卡片样式
- **且** 背景必须为半透明（暗色 rgba(255,255,255,0.08) / 亮色 rgba(255,255,255,0.6)）
- **且** 边框必须为半透明细线（1px）
- **且** 圆角必须为 12px
- **且** 图标颜色必须为主色（primary）

#### Scenario: 按钮悬停

- **当** 用户悬停在按钮上
- **然后** 按钮背景透明度必须增加
- **且** 必须有 scale(1.02) 微缩放效果
- **且** 过渡时间必须为 200ms
- **且** 光标必须变为 pointer

### Requirement: Footer 区域

Footer 区域 MUST 显示快捷键提示，MUST 使用毛玻璃分割线，高度 36px。

#### Scenario: 快捷键提示

- **当** 用户查看 Footer 区域
- **然后** 必须显示快捷键提示文字
- **且** 文字颜色必须为弱化色（muted-foreground）
- **且** 字体大小必须为 11px
- **且** Footer 顶部必须有毛玻璃分割线
