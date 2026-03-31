# codegen Specification

## Purpose
TBD - created by archiving change restore-codegen-page. Update Purpose after archive.
## 需求
### 需求：CodeGen 页面整体布局

CodeGen 页面必须按照 ui.pen 设计稿还原，尺寸为 1440×900 全屏，采用 Liquid Glass 暗色主题渐变背景，包含 LeftPanel 和 PreviewArea 两个主要区域。

#### 场景：页面初始化

- **当** 用户打开 CodeGen 页面
- **那么** 页面必须为全屏布局（100vw × 100vh）
- **且** 背景必须为线性渐变（180° 旋转），从 #1E1E30 到 #151525（50% 位置）再到 #0D0D18
- **且** 页面必须包含左侧 LeftPanel 和右侧 PreviewArea 两个区域

### 需求：LeftPanel 面板

LeftPanel 必须为宽 360px 的毛玻璃效果面板，包含代码输入区域、语言选择、主题选择、背景色选择和导出按钮。

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

### 需求：代码输入区域

CodeArea 必须提供代码输入占位区域，显示示例代码和输入提示。

#### 场景：代码区域外观

- **当** 用户查看代码输入区域
- **那么** 区域高度必须为 300px，宽度为 fill_container
- **且** 背景色必须为 #FFFFFF08
- **且** 圆角必须为 12px
- **且** 必须有 1px #FFFFFF0A 边框
- **且** 上方必须显示 `paste your code here...` 提示文字（颜色 #3D3D3D，字号 12px）

#### 场景：示例代码显示

- **当** 代码输入区域渲染
- **那么** 必须显示示例代码行（使用 JetBrains Mono 字体，字号 12px）
- **且** 代码行必须使用 VS Code Dark+ 配色：关键字 #C586C0、字符串 #CE9178、函数 #569CD6

### 需求：语言选择器

LangSection 必须显示当前语言选择控件。

#### 场景：语言选择器外观

- **当** 用户查看语言选择区域
- **那么** 必须显示 `language` 标签文字（颜色 #3D3D3D，字号 11px）
- **且** 必须显示语言选择器容器（高度 36px，背景 #FFFFFF08，圆角 8px）
- **且** 选择器左侧必须显示 `javascript` 文字（颜色 #FFFFFF，字号 12px）
- **且** 选择器右侧必须显示 chevron-down 图标（颜色 #777777，尺寸 14×14px）

### 需求：主题选择区域

ThemeSection 必须提供代码高亮主题选择功能。

#### 场景：主题色块显示

- **当** 用户查看主题选择区域
- **那么** 必须显示 `theme` 标签文字（颜色 #3D3D3D，字号 11px）
- **且** 必须显示 4 个主题色块（40×40px，圆角 8px）
- **且** 4 个色块颜色必须分别为：#1E1E1E（VS Code Dark+）、#282C34（One Dark）、#002B36（Solarized Dark）、#FAFAFA（Light）
- **且** 当前选中项必须有 2px #FF6B35 橙色边框指示

### 需求：背景色选择区域

BgSection 必须提供代码窗口背景色选择功能。

#### 场景：背景色块显示

- **当** 用户查看背景色选择区域
- **那么** 必须显示 `background` 标签文字（颜色 #3D3D3D，字号 11px）
- **且** 必须显示 5 个背景色块（40×40px，圆角 8px）
- **且** 5 个色块颜色必须分别为：#6366F1（Indigo）、#8B5CF6（Violet）、#EC4899（Pink）、#0EA5E9（Sky）、#10B981（Emerald）
- **且** 当前选中项必须显示 check 图标（颜色 #FFFFFF，尺寸 16×16px）

### 需求：导出按钮

ExportBtn 必须提供导出图片功能的入口按钮。

#### 场景：导出按钮外观

- **当** 用户查看导出按钮
- **那么** 按钮宽度必须为 fill_container，高度 44px
- **且** 背景色必须为 #00D4AA
- **且** 圆角必须为 12px
- **且** 按钮文字必须为 `$ export_image`（颜色 #0D0D0D，字号 13px，font-weight 600）
- **且** 按钮左侧必须显示 image 图标（颜色 #0D0D0D，尺寸 16×16px）

### 需求：代码预览区域

PreviewArea 必须在右侧展示代码窗口预览效果。

#### 场景：预览区域背景

- **当** 用户查看预览区域
- **那么** 预览区域必须占据剩余空间（fill_container）
- **且** 背景色必须为 #6366F1
- **且** 内容必须垂直水平居中

#### 场景：代码窗口外观

- **当** 预览区域渲染
- **那么** 必须显示 CodeWindow（520×380px，背景 #1E1E1E，圆角 12px）
- **且** CodeWindow 必须有外阴影（颜色 #00000050，偏移 y=8，模糊 40px）
- **且** CodeWindow 顶部必须显示 WindowHeader（高度 40px，背景 #252526，顶部圆角 12px）
- **且** WindowHeader 必须包含红 (#FF5F56)、黄 (#FFBD2E)、绿 (#27C93F) 三个圆点（12×12px，圆形）
- **且** 圆点右侧必须显示文件名 `greet.js`（颜色 #777777，字号 12px）
- **且** CodeWindow 下方必须显示 WindowBody，包含语法高亮的示例代码（内边距 20px，行间距 4px）

