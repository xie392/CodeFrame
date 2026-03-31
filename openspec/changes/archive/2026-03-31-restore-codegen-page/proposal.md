# 变更：根据设计稿还原代码编辑器页面并添加 Popup 跳转逻辑

## 为什么

当前 `src/codegen/App.tsx` 仅为 58 行的静态 UI 原型（旧版终端风格），与 ui.pen 设计稿中定义的 Liquid Glass 风格 CodeGen 页面（1440×900）差距较大。同时，Popup 页面 FeatureList 中的"代码编辑器"按钮 `onClick` 仅执行 `console.log('code editor')`，未实现跳转逻辑，且 manifest.json 未注册 codegen 页面路由。

## 变更内容

- 根据 ui.pen 设计稿还原 CodeGen 页面 UI（暗色主题），包括 LeftPanel（代码输入、语言选择、主题选择、背景色选择、导出按钮）和 PreviewArea（代码窗口预览）
- 在 Popup 的"代码编辑器"按钮中添加 `chrome.tabs.create({ url: chrome.runtime.getURL('src/codegen/index.html') })` 跳转逻辑
- 在 manifest.json 中将 codegen 页面注册为独立扩展页面（通过 `web_accessible_resources` 或新建 tab 页面方案）

## 影响

- 受影响规范：`popup`（新增代码编辑器按钮跳转需求）、`codegen`（新增功能规范）
- 受影响代码：
  - `src/codegen/App.tsx` — 重写为设计稿还原版本
  - `src/codegen/index.html` — 可能需要调整样式引用
  - `src/popup/App.tsx:287-291` — 修改 onClick 处理函数
  - `manifest.json` — 添加 codegen 页面路由注册
