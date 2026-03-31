## 移除需求

### 需求：语言选择器
**原因**：语言始终硬编码为 JavaScript，语言选择器仅有静态 UI 无交互功能，移除以简化面板并腾出空间给真正可用的主题切换。
**迁移**：无。代码语言保持 JavaScript 固定。

## 修改需求

### 需求：LeftPanel 面板

LeftPanel 必须为宽 360px 的毛玻璃效果面板，包含代码输入区域、主题选择、背景色选择和导出按钮。

#### 场景：面板外观

- **当** 用户查看 LeftPanel
- **那么** 面板宽度必须为 360px，高度为 fill_container
- **且** 面板必须具有毛玻璃效果（background-blur: 20px）
- **且** 面板背景必须为半透明渐变（#FFFFFF18 到 #FFFFFF0C）
- **且** 面板必须有 1px #FFFFFF12 边框
- **且** 面板内边距必须为 20px，元素间距为 16px

#### 场景：面板标题

- **当** 用户查看 LeftPanel 顶部
- **那么** 必须显示 `>` 提示符（颜色 #00D4AA，字号 16px，font-weight 700）和 `code_input` 标题（颜色 #FFFFFF，字号 14px）

### 需求：主题选择区域

ThemeSection 必须提供代码展示区域主题选择功能，用户切换主题后右侧整个代码展示区域（窗口样式 + 语法高亮配色）必须实时统一更新。

#### 场景：主题色块显示

- **当** 用户查看主题选择区域
- **那么** 必须显示 `theme` 标签文字（颜色 #3D3D3D，字号 11px）
- **且** 必须显示 4 个主题色块（40×40px，圆角 8px）
- **且** 4 个色块颜色必须分别为：#1E1E1E（VS Code Dark+）、#282C34（One Dark）、#002B36（Solarized Dark）、#FAFAFA（Light）
- **且** 当前选中项必须有 2px #FF6B35 橙色边框指示

#### 场景：主题切换生效

- **当** 用户点击某个主题色块
- **那么** 该色块必须显示选中状态（2px #FF6B35 橙色边框）
- **且** 右侧 PreviewArea 的代码窗口整体视觉风格必须切换为对应主题（VS Code Dark+ → `dark-plus`、One Dark → `one-dark-pro`、Solarized Dark → `solarized-dark`、Light → `github-light`）
- **且** 代码窗口背景色必须从主题配置中读取（如 VS Code Dark+ 为 #1E1E1E、Light 为 #FFFFFF）
- **且** 代码窗口标题栏背景色必须从主题配置中读取（如 VS Code Dark+ 为 #252526、Light 为 #F0F0F0）
- **且** Shiki 语法高亮配色必须使用对应的 Shiki 主题渲染

### 需求：代码预览区域

PreviewArea 必须在右侧展示 Shiki 语法高亮的代码窗口预览效果，代码窗口的整体视觉风格必须与左侧选中的主题同步。

#### 场景：预览区域背景

- **当** 用户查看预览区域
- **那么** 预览区域必须占据剩余空间（fill_container）
- **且** 背景色必须随用户选择的背景色变化
- **且** 内容必须垂直水平居中

#### 场景：代码窗口外观

- **当** 预览区域渲染
- **那么** 必须显示 CodeWindow（520×380px，圆角 12px）
- **且** CodeWindow 背景色必须随选中主题变化（深色主题为深色背景，浅色主题为浅色背景）
- **且** CodeWindow 必须有外阴影（颜色 #00000026，偏移 y=8，模糊 40px）
- **且** CodeWindow 顶部必须显示 WindowHeader（高度 40px，顶部圆角 12px）
- **且** WindowHeader 背景色必须随选中主题变化
- **且** WindowHeader 必须包含红 (#FF5F56)、黄 (#FFBD2E)、绿 (#27C93F) 三个圆点（12×12px，圆形）
- **且** 圆点右侧必须显示文件名 `greet.js`（颜色 #777777，字号 12px）
- **且** CodeWindow 下方必须显示 WindowBody，包含 Shiki 语法高亮渲染的代码（内边距 20px，JetBrains Mono 字体）

#### 场景：预览内容同步

- **当** 用户在左侧编辑器中输入代码或切换主题
- **那么** 右侧 WindowBody 必须实时显示 Shiki 语法高亮后的代码内容
- **且** 高亮渲染必须使用 `shiki/engine/javascript` 引擎（避免 WASM CSP 问题）
- **且** 高亮结果必须缓存，仅在代码内容或选中主题变更时重新渲染
