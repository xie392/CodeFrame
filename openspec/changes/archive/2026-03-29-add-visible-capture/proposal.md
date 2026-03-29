# 变更：实现可视区域截图功能

## 为什么

CodeFrame 的核心定位是"截图标注 + 代码美化"一站式工具，截图捕获是 P0 优先级功能。当前 Popup 中"可视截图"按钮仅为 `console.log` 占位，Background Service Worker 和 Content Script 中的截图消息处理全部为 TODO 状态，无法执行任何实际的截图操作。需要率先实现可视区域截图（最基础的截图模式），为后续区域截图、整页截图奠定消息通信架构基础。

## 变更内容

- 新增 `screenshot` 能力规范，定义可视区域截图的完整行为
- 在 Background Service Worker 中实现 `CAPTURE_REQUEST` 消息处理，调用 `chrome.tabs.captureVisibleTab()` 完成截图
- 在 Popup 中绑定"可视截图"按钮的真实行为（发送消息 → 关闭 Popup → 接收截图结果）
- 新增截图 store（Zustand），管理截图状态和截图结果数据
- 截图完成后将 base64 imageData 传递给 Editor（本次仅传递数据，Editor 打开/渲染由后续变更实现）

## 影响

- 受影响规范：`screenshot`（新增）、`popup`（修改——按钮行为从占位变为实际截图）
- 受影响代码：
  - `src/background/index.ts` — 实现 CAPTURE_REQUEST 处理
  - `src/popup/App.tsx` — 绑定可视截图按钮
  - `src/shared/messages.ts` — 补充截图结果消息类型
  - 新增 `src/shared/stores/capture-store.ts` — 截图状态管理
  - 新增 `src/background/handlers/capture.ts` — 截图处理逻辑
