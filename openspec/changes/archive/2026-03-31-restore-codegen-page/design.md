## 上下文

CodeGen（代码编辑器）是 CodeFrame 的核心功能之一，用于将代码输入转化为美化截图。当前实现为静态占位 UI，需要根据 ui.pen 设计稿还原为完整页面。同时需要解决从 Popup 跳转到 CodeGen 页面的路由问题。

涉及两个模块的协调：
- **Popup 模块**：需要添加按钮跳转逻辑
- **CodeGen 模块**：需要重写页面 UI
- **manifest.json**：需要注册 codegen 页面使 Chrome 扩展能正确打开

## 目标 / 非目标

- 目标：
  - 按 ui.pen 设计稿还原 CodeGen 暗色主题页面 UI（含 LeftPanel + PreviewArea）
  - Popup "代码编辑器"按钮点击后在新标签页中打开 CodeGen 页面
  - manifest.json 正确注册 codegen 页面路由
- 非目标：
  - 不实现代码语法高亮逻辑（Shiki 集成留待后续变更）
  - 不实现导出图片功能（html-to-image 集成留待后续变更）
  - 不实现语言选择、主题选择的交互逻辑（仅还原静态 UI）
  - 不实现 CodeGen 亮色主题变体

## 决策

### 页面打开方式

- 决策：使用 `chrome.tabs.create({ url: chrome.runtime.getURL('src/codegen/index.html') })` 在新标签页中打开 codegen 页面
- 考虑的替代方案：
  - 在 Popup 内打开 codegen（使用 iframe）→ Popup 尺寸 363×461 太小，无法容纳 1440×900 的代码编辑器
  - 使用 `chrome.windows.create` 打开独立窗口 → 过于复杂，用户更习惯标签页
  - 通过 `chrome_url_overrides` 覆盖新标签页 → 侵入性太强，影响用户日常浏览

### manifest.json 路由注册

- 决策：在 `web_accessible_resources` 中添加 `src/codegen/index.html`，并在构建后将文件复制到扩展根目录（通过 Vite 配置处理）
- 考虑的替代方案：
  - 添加 `"open_code_editor"` command + `_execute_action` → 无法直接打开非 popup 页面
  - 使用 SidePanel API → 兼容性不够，且设计稿为全屏页面

### UI 还原范围

- 决策：仅还原暗色主题（CodeGen）的静态 UI，不包含交互功能
- 理由：当前阶段优先完成视觉还原和路由打通，交互逻辑（语法高亮、导出、语言切换）作为独立变更逐步实施

## 风险 / 权衡

- **构建路径问题**：Vite 打包后的 codegen 页面路径可能与 `chrome.runtime.getURL` 不匹配 → 需要验证构建输出路径
- **CSS 变量兼容**：CodeGen 页面使用的设计稿配色与 Popup 页面不同（Liquid Glass vs Terminal Minimal）→ 使用独立的 CSS 变量或 Tailwind 工具类

## 待决问题

- Vite 构建后 codegen 页面的实际输出路径需要确认（影响 `chrome.runtime.getURL` 中的路径参数）
