# 变更：实现图片编辑器页面 UI 与跳转逻辑

## 为什么

codegen（代码美化）页面已基本完成，现在需要实现 editor（图片编辑器）页面的 UI 框架和从 popup 页面的跳转逻辑。编辑器是产品的核心功能之一，用户通过截图或手动上传图片后进入此页面进行标注和编辑。

## 变更内容

- 实现 editor 页面的完整 UI 布局（左侧工具栏 + 中央画布 + 右侧属性面板）
- 实现 popup 中"编辑本地或粘贴图片"按钮的跳转逻辑（打开 editor 页面）
- 实现截图完成后自动跳转到 editor 页面并携带截图数据
- editor 页面支持两种进入模式：带图模式（截图后）和空画布模式（手动上传/粘贴）

## 影响

- 受影响规范：editor（新增）、popup（修改）
- 受影响代码：
  - `src/editor/App.tsx`（重写，当前为骨架）
  - `src/editor/index.html`（可能调整样式引入）
  - `src/popup/App.tsx`（修改跳转逻辑）
  - `src/shared/constants.ts`（新增存储键）
  - `src/shared/messages.ts`（可能新增消息类型）
  - `src/background/handlers/capture.ts`（修改截图完成后跳转逻辑）
