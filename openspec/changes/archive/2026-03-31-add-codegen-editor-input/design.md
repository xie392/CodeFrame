## 上下文

CodeGen 页面需要在 Chrome Extension (Manifest V3) 环境下提供代码编辑体验。MV3 CSP 强制禁止 `eval()`、内联脚本和 `blob:` URL Worker。

### 约束

- Manifest V3 CSP：禁止 `eval()`、`new Function()`、内联脚本、`blob:` URL
- 编辑器仅运行在 codegen 页面（独立 tab），不受 popup 内存限制
- 需要与 React 18 集成

## 目标 / 非目标

- 目标：左侧提供可编辑的代码编辑器，右侧预览区实时显示高亮后的代码
- 目标：编辑器支持行号、括号匹配、自动缩进等基础编辑功能
- 非目标：实现代码导出/截图功能（留待后续变更）
- 非目标：实现语言选择切换（仅支持 JavaScript，留待后续变更）
- 非目标：实现主题选择切换编辑器样式（仅使用 VS Code Dark 主题）

## 决策

### 决策 1：代码编辑器选型 — CodeMirror 6

- **选择**：CodeMirror 6（通过 `@uiw/react-codemirror`）
- **原因**：
  - CSP 原生兼容，不使用 eval/blob worker/内联脚本
  - 包大小合理（~125 KB gzip，含 JS 语言包）
  - 完整编辑能力：行号、括号匹配、自动缩进、搜索
  - React 集成成熟（`@uiw/react-codemirror` 20万+ 周下载）
- **排除方案**：
  - Monaco Editor：MV3 CSP 严重不兼容（blob worker 被拦截、内联样式违规），需大量 workaround
  - textarea + Shiki 叠加：Shiki 是高亮器不是编辑器，需自实现行号、滚动同步等基础功能

### 决策 2：预览区语法高亮 — Shiki

- **选择**：Shiki（使用 `shiki/engine/javascript` 纯 JS 引擎）
- **原因**：
  - 项目技术栈已规划使用 Shiki（project.md 明确列出）
  - 语言支持最广（200+），高亮精度最高（TextMate grammar，VS Code 同款）
  - 使用 `dark-plus` 主题（VS Code Dark+ 对应）和 JavaScript RegExp 引擎避免 WASM CSP 问题
  - 预览区为只读，Shiki 的纯输出特性完美匹配
- **排除方案**：
  - CodeMirror 的 `@codemirror/lang-javascript` 高亮：两侧使用同一高亮引擎会导致代码耦合，预览区需要自定义渲染样式与导出需求冲突

### 决策 3：编辑器主题

- **选择**：`@uiw/codemirror-theme-vscode`（VS Code Dark+ 主题）
- **原因**：与现有页面暗色风格和预览区窗口样式（#1E1E1E 背景）一致

## 风险 / 权衡

| 风险 | 缓解措施 |
|------|----------|
| Shiki 首次高亮延迟（~50-300ms） | 使用 `React.useMemo` 缓存高亮结果，仅在代码变更时重新高亮 |
| CodeMirror + Shiki 两个高亮引擎增加包体积 | 按需加载 Shiki 语言包，总增量约 175 KB gzip，在可接受范围 |
| 编辑器样式与页面整体风格不一致 | 通过 CodeMirror 主题包 + 自定义 CSS 覆盖确保一致性 |

## 待决问题

- 是否需要支持 Tab 键缩进（CodeMirror 默认支持，但需确认在 textarea 聚焦时的行为）
