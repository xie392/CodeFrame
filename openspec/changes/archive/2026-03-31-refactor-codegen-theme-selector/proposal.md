# 变更：重构 CodeGen 主题选择器，使用 CodeMirror 库自带主题

## 为什么

当前 CodeGen 的编辑器主题切换存在两个核心问题：

1. **主题是"假切换"**：虽然定义了 12 个主题（One Dark、Dracula、Nord 等），但实际上所有暗色主题都映射到同一个 `vscodeDark` CodeMirror 主题，所有亮色主题映射到 `vscodeLight`。切换主题只是换了窗口背景色和自定义语法高亮色，编辑器本身（gutter、光标、选中态、滚动条等）的样式全部是 VS Code 的样子，导致主题体验不真实。

2. **背景色与行号不一致**：`theme` prop（vscodeDark/vscodeLight）会设置 `.cm-gutters` 的 `backgroundColor` 为 `#1e1e1e`，而 `EditorView.theme()` 覆盖层将其设为 `transparent`。由于 CSS 特异性问题，两者叠加冲突，导致 gutter 背景色可能在某些主题下与编辑器背景色不匹配。

## 变更内容

- 将主题切换从"自定义配色覆盖"改为直接使用 CodeMirror 社区主题库（`@uiw/codemirror-themes` 系列包），每个主题对应一个真实的 CodeMirror 主题
- 保留自定义语法高亮颜色（通过 `syntaxHighlighting`），但 gutter、背景、光标、选中态等 UI 元素完全由库主题控制
- 将主题选择器 UI 从色块横滚改为下拉选择器（Select），支持显示主题名称，提升可用性
- 移除 `EditorView.theme()` 中的背景色/gutter 覆盖，改为通过库主题自带配置实现
- 保留窗口背景色（`windowBg`）和标题栏背景色（`headerBg`）的配置，用于代码窗口容器样式

## 影响

- 受影响规范：`codegen`
- 受影响代码：
  - `src/codegen/App.tsx`（编辑器配置、主题选择器 UI）
  - `src/codegen/config/themes.ts`（主题配置结构变更）
- 新增依赖：`@uiw/codemirror-theme-*` 系列主题包（按需安装）
