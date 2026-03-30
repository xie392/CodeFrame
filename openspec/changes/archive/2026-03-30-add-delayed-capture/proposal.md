# 变更：实现延时截取可视区域功能

## 为什么

用户需要在截图前有准备时间（如打开菜单、展开下拉框、等待动画完成），当前可视区域截图是立即执行的，无法满足此类场景。延时截图是竞品 ShotEasy 的 v1.1.0 规划功能，也是 Chrome 截图工具的常见能力。

## 变更内容

- 在 Popup 的「延时截取可视区域」入口处添加延时时间选择交互（3s / 5s / 10s）
- Popup 关闭后，Content Script 在页面上显示倒计时覆盖层（圆形进度 + 剩余秒数）
- 倒计时结束后自动执行可视区域截图，复用现有 `captureVisibleTab()` 流程
- 倒计时期间用户可按 `Escape` 取消

## 影响

- 受影响规范：`screenshot`（新增延时截图需求）、`popup`（新增延时截图按钮行为需求）
- 受影响代码：
  - `src/popup/App.tsx` — 替换 `console.log('delayed capture')` 为实际处理函数
  - `src/background/index.ts` — 消息路由新增 `delayed` 模式处理
  - `src/background/handlers/capture.ts` — 新增延时截图处理函数
  - `src/content/index.ts` — 新增倒计时覆盖层消息监听
  - `src/shared/messages.ts` — 新增 `START_DELAYED_CAPTURE`、`CAPTURE_DELAYED_READY`、`CANCEL_DELAYED_CAPTURE` 消息类型
