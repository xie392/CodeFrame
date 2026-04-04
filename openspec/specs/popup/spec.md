# popup Specification

## Purpose
TBD - created by archiving change implement-popup-ui. Update Purpose after archive.
## 需求
### 需求：Popup 页面布局

Popup 页面必须按照 Terminal Minimal 设计风格实现，尺寸为 360px × 500px，包含四个主要区域：Header、Tab 导航、内容区域、Footer。

#### 场景：页面初始化

- **当** 用户打开 Popup 页面
- **那么** 页面必须显示完整的 Header、Tab 导航、内容区域、Footer
- **且** 页面背景色必须为 #0C0C0C
- **且** 页面字体必须为 JetBrains Mono

### 需求：Header 区域

Header 区域必须包含 Logo 和操作按钮，高度 48px。

#### 场景：Logo 显示

- **当** 用户查看 Header 区域
- **那么** Logo 必须显示为 `~` 符号（#22C55E）+ `codeframe` 文字（#E5E5E5）
- **且** `~` 符号字体大小必须为 18px，font-weight 600
- **且** `codeframe` 文字字体大小必须为 14px，font-weight 500

#### 场景：操作按钮

- **当** 用户查看 Header 右侧
- **那么** 必须显示 Moon 图标和 Settings 图标
- **且** 图标大小必须为 14×14px
- **且** 图标颜色必须为 #737373

### 需求：Tab 导航

Tab 导航必须支持三个 Tab（screenshot、code、local），高度 44px，支持活动状态指示。

#### 场景：Tab 活动状态

- **当** Tab 处于活动状态
- **那么** Tab 文字必须显示 `>` 前缀
- **且** 文字颜色必须为 #22C55E
- **且** 必须显示底部绿色下划线（高度 2px）

#### 场景：Tab 非活动状态

- **当** Tab 处于非活动状态
- **那么** Tab 文字必须显示两个空格前缀
- **且** 文字颜色必须为 #737373
- **且** 底部下划线必须不可见

#### 场景：Tab 切换

- **当** 用户点击非活动 Tab
- **那么** 该 Tab 必须切换为活动状态
- **且** 之前活动的 Tab 必须切换为非活动状态

### 需求：截图操作按钮

内容区域必须包含 5 个截图操作按钮，按 3+2 网格布局排列。

#### 场景：按钮布局

- **当** 用户查看内容区域
- **那么** 必须显示两行按钮
- **且** 第一行必须有 3 个按钮（region、visible、fullpage）
- **且** 第二行必须有 2 个按钮（desktop、delayed）
- **且** 按钮之间间距必须为 12px

#### 场景：按钮样式

- **当** 用户查看任意操作按钮
- **那么** 按钮尺寸必须为 100×80px
- **且** 圆角必须为 4px
- **且** 背景色必须为 #171717
- **且** 边框必须为 1px #1F1F1F
- **且** 图标必须为 18×18px，颜色 #22C55E
- **且** 文字必须为 12px，颜色 #E5E5E5

#### 场景：按钮悬停

- **当** 用户悬停在按钮上
- **那么** 按钮背景色必须变为 #1A1A1A
- **且** 光标必须变为 pointer

### 需求：Footer 区域

Footer 区域必须显示快捷键提示，高度 36px。

#### 场景：快捷键提示

- **当** 用户查看 Footer 区域
- **那么** 必须显示 `// shortcuts: alt+shift+s capture | alt+shift+c code`
- **且** 文字颜色必须为 #525252
- **且** 字体大小必须为 10px

### 需求：可视截图按钮行为

Popup 中"可视截图"按钮必须绑定实际的截图触发逻辑，取代当前的占位行为。

#### 场景：点击可视截图按钮

- **当** 用户点击 ActionRow 中的"可视截图"按钮
- **那么** 必须向 Background Service Worker 发送 `CAPTURE_REQUEST` 消息（`mode: 'visible'`）
- **且** 消息发送后必须立即关闭 Popup 窗口

#### 场景：快捷键触发截图

- **当** 用户在任意页面按下 `Alt+Shift+S` 快捷键
- **那么** 必须触发与"可视截图"按钮相同的截图流程
- **且** 无需打开 Popup 窗口

### 需求：选择区域按钮行为

Popup 中「选择区域」按钮必须触发区域截图流程，将截图请求路由到 Content Script 进行交互式选区。

#### 场景：点击选择区域按钮

- **当** 用户在 Popup 中点击「选择区域」按钮（Scissors 图标）
- **那么** 必须向 Background Service Worker 发送 `CAPTURE_REQUEST` 消息，payload 为 `{ mode: 'region' }`
- **且** Popup 必须在消息发送后关闭（`setTimeout(window.close, 100)`）

#### 场景：选择区域截图快捷键

- **当** 用户按下 `Alt+Shift+R` 快捷键
- **那么** 必须触发与按钮一致的区域截图流程
- **且** 背景页面区域截图命令处理必须调用区域截图处理函数

### 需求：延时截图入口行为

Popup 中「延时截取可视区域」入口必须使用 Options 设置中配置的延迟时间。

#### 场景：点击延时截图入口

- **当** 用户点击 FeatureList 中的「延时截取可视区域」按钮（Timer 图标）
- **那么** 必须从设置中读取 `delayTime` 配置
- **且** 向 Background Service Worker 发送 `CAPTURE_REQUEST` 消息，payload 包含 `mode: 'delayed'` 和 `delay` 值（来自设置）
- **且** Popup 必须在消息发送后关闭（`setTimeout(window.close, 100)`）

#### 场景：显示当前延迟时间

- **当** 用户查看延时截图入口
- **那么** 入口右侧必须显示当前设置的延迟时间（如「3s」）
- **且** 延迟时间必须与 Options 设置中的「延迟截图时间」同步

#### 场景：设置未加载时使用默认值

- **当** 设置未加载或 `delayTime` 为空
- **那么** 必须使用默认延迟时间 3 秒
- **且** 入口右侧显示「3s」

### 需求：代码编辑器按钮跳转

Popup 页面 FeatureList 中的"代码编辑器"按钮必须实现在新标签页中打开 CodeGen 页面的跳转逻辑。

#### 场景：点击代码编辑器按钮

- **当** 用户在 Popup 页面 FeatureList 中点击"代码编辑器"按钮（Code 图标）
- **那么** 必须使用 `chrome.tabs.create` 在新标签页中打开 CodeGen 页面
- **且** Popup 窗口必须在打开新标签页后关闭

