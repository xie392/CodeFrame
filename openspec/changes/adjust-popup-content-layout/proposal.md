# 变更：调整 Popup Screenshot Tab 内容布局

## 为什么

当前 Popup Screenshot Tab 内容区域使用 3+2 网格按钮布局（Region + Visible + Full Page + Desktop + Delayed），与 `docs/04-ui-design-document.md` 中 "3.1 Popup 主弹窗" 的设计不符。设计文档要求第一行为 3 个主要操作按钮，下方为功能列表。

## 变更内容

- 将 Screenshot Tab 内容从 "3+2 网格按钮" 改为 "3 个操作按钮 + 功能列表"
- 第一行保持 3 个操作按钮（可视截图、选择区域、整页截图），尺寸 96x80px
- 移除第二行 2 个按钮（Desktop、Delayed）
- 新增功能列表区域，包含 4 项：延时截取可视区域、全屏截图、编辑本地或粘贴图片、代码编辑器
- 移除 Quick tip 卡片（功能列表已覆盖快捷键提示场景）

## 影响

- 受影响规范：popup/spec.md（修改 "截图操作按钮" 需求）
- 受影响代码：`src/popup/App.tsx`（Screenshot Tab 内容区域）
