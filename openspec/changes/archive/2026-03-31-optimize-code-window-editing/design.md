## 上下文

Code Window 当前编辑模式使用原生 `<textarea>`（`src/codegen/App.tsx:726`），纯白色无高亮。项目已安装 `@uiw/react-codemirror`（`^4.25.9`）和 `@uiw/codemirror-theme-vscode`（`^4.25.9`），但在最近的 Canvas 交互重构中编辑器被替换为 textarea 以简化实现。

### 约束

- Manifest V3 CSP：禁止 `eval()`、内联脚本、`blob:` URL
- CodeMirror 6 已验证 CSP 兼容（之前的归档设计文档已确认）
- 编辑器运行在 codegen 独立 tab，不受 popup 内存限制

## 目标 / 非目标

- 目标：编辑模式下使用 CodeMirror 提供语法高亮、行号、括号匹配
- 目标：编辑器主题与用户选中的预览主题同步
- 目标：代码窗口高度自适应代码行数（最少 1 行，最大 `MAX_WIN_H`）
- 非目标：更换预览区的 Shiki 高亮（预览区仍使用 Shiki 只读渲染）
- 非目标：增加新的编辑器语言支持（仍仅 JavaScript）
- 非目标：增加新的主题选项（保持现有 4 个主题）

## 决策

### 决策 1：编辑器组件 — 使用已安装的 @uiw/react-codemirror

- **选择**：在编辑模式下渲染 `@uiw/react-codemirror` 组件替换 `<textarea>`
- **原因**：
  - 项目已安装此依赖，无需新增包（仅可能新增主题包）
  - CSP 兼容已验证
  - 原生支持行号、括号匹配、自动缩进、Tab 键
  - React 集成成熟
- **实现方式**：在 `isEditing ? (...) : (...)` 分支中，编辑分支渲染 `<CodeMirror>` 组件而非 `<textarea>`

### 决策 2：编辑器主题映射

- **选择**：使用 `@uiw/codemirror-theme-vscode` 包中的主题进行映射
- **映射关系**：

| 预览主题 | 编辑器 CodeMirror 主题 | 导入来源 |
|----------|----------------------|----------|
| vs-dark | `vscodeDark` | `@uiw/codemirror-theme-vscode`（已安装） |
| one-dark | `vscodeDark`（暂用 dark 主题，视觉效果接近）或安装 `@uiw/codemirror-theme-vscode` 的 `vscodeDark` | 已安装 |
| solarized | `vscodeDark`（暂用 dark 主题）或安装独立主题包 | 待评估 |
| light | `vscodeLight` | `@uiw/codemirror-theme-vscode`（已安装） |

- **简化方案**：先使用 `vscodeDark` / `vscodeLight` 两种主题覆盖暗色/浅色，避免引入过多依赖。后续可通过 `@uiw/codemirror-themes-all` 统一管理。

### 决策 3：窗口高度自适应

- **选择**：根据代码行数动态计算窗口高度
- **计算公式**：`height = headerHeight(40) + paddingVertical(20×2) + codeLines × lineHeight(20) + buffer`
- **最小高度**：至少显示 1 行代码
- **最大高度**：不超过 `MAX_WIN_H`（800px）
- **实现**：监听 `code` 状态变化，计算行数后更新 `winSize.height`

## 风险 / 权衡

| 风险 | 缓解措施 |
|------|----------|
| CodeMirror 组件在画布缩放/平移下的交互行为异常 | CodeMirror 仅在编辑模式渲染，编辑模式禁用画布缩放/平移 |
| 窗口高度频繁变化导致视觉抖动 | 使用 `Math.max` 确保最小高度，resize handle 允许用户手动调整 |
| CodeMirror 主题与 Shiki 主题色差 | 编辑器和预览区使用不同引擎是合理设计，Carbon 等竞品也是如此 |
