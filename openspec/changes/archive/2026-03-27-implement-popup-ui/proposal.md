# 变更：实现 Popup 页面 UI

## 为什么

根据最新的 UI 设计稿（Terminal Minimal 风格），需要将 Popup 页面从当前的占位实现还原为完整的设计稿布局。当前实现只有基础的 Header 和占位内容，需要添加完整的 Tab 导航、截图操作按钮网格和 Footer 快捷键提示。

## 变更内容

### Header 区域
- Logo: `~` 符号（绿色）+ `codeframe` 文字（白色）
- 右侧操作按钮: Moon 图标（主题切换）+ Settings 图标（设置）

### Tab 导航区域
- 三个 Tab: `screenshot`、`code`、`local`
- 活动状态: `>` 前缀 + 绿色文字 + 底部绿色下划线
- 非活动状态: 两个空格前缀 + 灰色文字

### 内容区域
- 截图操作按钮网格（3+2 布局）
- 第一行: `region`（区域截图）、`visible`（可视区域）、`fullpage`（整页截图）
- 第二行: `desktop`（桌面截图）、`delayed`（延迟截图）
- 按钮样式: 100×80px，圆角 4px，边框 1px，Surface 背景

### Footer 区域
- 快捷键提示: `// shortcuts: alt+shift+s capture | alt+shift+c code`

## 影响

- 受影响规范：popup/spec.md（新增）
- 受影响文件：`src/popup/App.tsx`、`src/popup/index.html`
- 设计稿参考：`codeframe-ui.pen` (Popup Main)
