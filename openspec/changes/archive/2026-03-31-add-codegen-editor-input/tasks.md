## 1. 安装依赖

- [x] 1.1 安装 `@uiw/react-codemirror`、`@codemirror/lang-javascript`、`@uiw/codemirror-theme-vscode`
- [x] 1.2 安装 `shiki`（用于预览区语法高亮）

## 2. 实现代码编辑器（左侧输入区）

- [x] 2.1 在 `App.tsx` 中新增 `code` 状态，默认值为示例代码纯文本字符串
- [x] 2.2 将左侧 CodeArea 的静态 `<span>` 展示替换为 `<CodeMirror>` 组件
- [x] 2.3 配置 CodeMirror：`basicSetup`、`javascript()` 语言支持、`vscodeDark` 主题
- [x] 2.4 编辑器样式适配：高度 300px、圆角 12px、JetBrains Mono 字体、隐藏默认边框
- [x] 2.5 移除 SAMPLE_CODE 硬编码常量

## 3. 实现右侧预览同步 + Shiki 高亮

- [x] 3.1 初始化 Shiki 高亮器（`shiki/engine/javascript`，`theme: 'dark-plus'`）
- [x] 3.2 将右侧 WindowBody 的渲染逻辑从 SAMPLE_CODE 切换为 Shiki 高亮输出
- [x] 3.3 使用 `React.useEffect` 缓存 Shiki 高亮结果，仅在 `code` 变更时重新计算
- [x] 3.4 WindowBody 中通过 `dangerouslySetInnerHTML` 渲染 Shiki 输出的 HTML

## 4. 验证

- [x] 4.1 构建验证：`npm run build` 无报错
- [x] 4.2 手动验证：打开 codegen 页面，确认编辑器可输入、右侧实时高亮同步
- [x] 4.3 CSP 验证：确认无 CSP 违规（Chrome DevTools Console 无错误）
