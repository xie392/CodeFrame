# 变更：实现 CodeGen 页面代码输入功能

## 为什么

当前 CodeGen 页面的代码输入区域（code_input 下方）是一个纯静态展示区域，仅渲染硬编码的 `SAMPLE_CODE` 常量。用户无法输入代码，也无法看到自己输入的代码在右侧预览区域中实时更新。这使得 CodeGen 页面尚未具备核心的「代码美化截图」输入能力。

## 变更内容

- 引入 CodeMirror 6（通过 `@uiw/react-codemirror`）作为代码编辑器，替换静态 CodeArea
- 新增 `code` 状态管理用户输入的代码内容
- 用户输入的代码实时同步到右侧 PreviewArea 的 WindowBody 中显示
- 保留当前示例代码作为初始默认值
- 右侧预览区使用 Shiki 进行语法高亮渲染（`shiki/engine/javascript`，避免 WASM CSP 问题）
- 编辑器主题使用暗色主题（如 `@uiw/codemirror-theme-vscode-dark`），与页面风格一致

## 影响

- 受影响规范：`codegen`
- 受影响代码：`src/codegen/App.tsx`
- 新增依赖：`@uiw/react-codemirror`、`@codemirror/lang-javascript`、`@uiw/codemirror-theme-vscode`、`shiki`（用于预览区高亮）
