# 变更：优化 Canvas Area 中 Code Window 的编辑体验

## 为什么

当前 Code Window 的编辑模式使用原生 `<textarea>`，代码以纯白色纯文本显示，没有语法高亮、行号等编辑器基础功能。项目已经安装了 `@uiw/react-codemirror` 及其主题包，但编辑模式并未使用。此外，代码窗口固定高度（380px），即使只有 3 行代码也会留下大量空白，视觉上不紧凑。

## 变更内容

- 将编辑模式的原生 `<textarea>` 替换为 `@uiw/react-codemirror` 组件，提供语法高亮编辑体验
- 编辑器主题必须随用户选中的主题切换（VS Code Dark+ → `vscodeDark`、One Dark → `oneDark`、Solarized → `solarizedDark`、Light → `vscodeLight`）
- 代码窗口高度改为自适应：最小 1 行代码高度，随代码行数自动增长，不超过 `MAX_WIN_H`
- 移除对 `textareaRef` 和手动 Tab 键缩进逻辑的依赖（CodeMirror 原生支持）

## 影响

- 受影响规范：`codegen`
- 受影响代码：`src/codegen/App.tsx`
- 新增依赖：`@uiw/codemirror-theme-vscode`（已安装）、可能需要额外的主题包
