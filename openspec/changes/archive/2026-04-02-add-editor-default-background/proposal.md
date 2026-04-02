# 变更：Editor 默认背景设置

## 为什么

Editor 当前默认背景为透明，用户打开编辑器时图片容器没有背景色，视觉效果不佳。用户希望有一个默认背景，且能自由设置背景。

## 变更内容

- 修改 Editor 图片容器的默认背景，从透明改为白色
- 背景设置功能已存在，无需新增 UI

## 影响

- 受影响规范：`specs/editor/spec.md`
- 受影响代码：`src/editor/App.tsx`（DEFAULT_FRAME_SETTINGS.background）
