## 修改需求

### 需求：主题选择区域

ThemeSection 必须提供代码展示区域主题选择功能，用户通过下拉选择器选择主题后，右侧代码窗口的编辑器主题（ gutter、光标、选中态、滚动条等 UI 元素）和代码窗口容器样式（背景色、标题栏背景色）必须实时统一更新。

#### 场景：主题选择器显示

- **当** 用户查看主题选择区域
- **那么** 必须显示 `theme` 标签文字（颜色 #3D3D3D，字号 11px）
- **且** 必须显示一个 Select 下拉选择器
- **且** 下拉选择器必须显示当前选中主题的名称
- **且** 下拉选项列表中每个选项必须包含主题名称
- **且** 下拉选择器宽度必须为 fill_container

#### 场景：主题切换生效

- **当** 用户通过下拉选择器选择某个主题
- **那么** 下拉选择器必须显示新选中主题的名称
- **且** 编辑器必须使用对应的 CodeMirror 原生主题（而非共用 vscodeDark/vscodeLight）
- **且** 代码窗口背景色必须从主题配置中读取（如 VS Code Dark+ 为 #1E1E1E、Light 为 #FFFFFF）
- **且** 代码窗口标题栏背景色必须从主题配置中读取（如 VS Code Dark+ 为 #252526、Light 为 #F0F0F0）
- **且** 编辑器 gutter（行号区域）背景色必须与编辑器背景色一致
- **且** 编辑器 gutter 前景色必须与主题配色方案一致
- **且** 编辑器光标、选中态、滚动条等 UI 元素必须使用主题对应的原生样式

### 需求：代码输入区域

CodeWindow 编辑模式必须使用 `@uiw/react-codemirror`（CodeMirror 6）提供代码编辑体验，编辑器必须具有语法高亮、行号、括号匹配和自动缩进功能。

#### 场景：编辑器主题同步

- **当** 用户在编辑模式下且选中了某个主题
- **那么** 编辑器必须使用对应的 CodeMirror 原生主题：
  - VS Code Dark+ → `@uiw/codemirror-theme-vscode` 的 `vscodeDark`
  - One Dark → `@uiw/codemirror-theme-one-dark` 的 `oneDark`
  - Dracula → `@uiw/codemirror-theme-dracula` 的 `draculaInit` 或对应导出
  - Nord → `@uiw/codemirror-theme-nord` 的对应导出
  - 其他主题 → 对应的 `@uiw/codemirror-theme-*` 包导出
- **且** 切换主题时编辑器必须立即更新
- **且** gutter 背景色必须与编辑器内容区背景色保持一致，不得出现色差
