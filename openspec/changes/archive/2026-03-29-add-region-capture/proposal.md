# 变更：实现选择区域截图功能

## 为什么

CodeFrame 的截图捕获模块已实现「可视区域截图」，但「选择区域截图」仍为 `console.log` 占位状态。选择区域截图是截图工具的核心 P0 功能（对标 ShotEasy），允许用户通过鼠标拖拽精确选取页面中的任意矩形区域进行截图。该功能需要引入 Content Script 端的交互式覆盖层（overlay），是当前架构中首个需要 Popup → Background → Content Script 三方协作的完整数据流场景。

## 变更内容

- 在 Content Script 中实现区域选择覆盖层（overlay）：半透明遮罩 + 可拖拽选区 + 尺寸提示 + 操作按钮（确认/取消）
- 在 Background Service Worker 中新增 `region` 模式的消息处理：先发送 `START_CAPTURE` 到 Content Script 启动选区，收到 `CAPTURE_REGION` 后裁剪截图
- 修改 Popup 中「选择区域」按钮行为：发送 `CAPTURE_REQUEST`（`mode: 'region'`）并关闭 Popup
- 新增 `CAPTURE_REGION` 消息类型，用于从 Content Script 向 Background 传递选区坐标
- 截图裁剪：在 Background 中先 `captureVisibleTab()` 获取全屏截图，再根据选区坐标通过 Canvas 裁剪目标区域

## 影响

- 受影响规范：`screenshot`（新增区域截图需求）、`popup`（修改选择区域按钮行为）
- 受影响代码：
  - `src/content/index.ts` — 从空骨架扩展为完整的区域选择覆盖层逻辑
  - `src/background/index.ts` — 新增 `region` 模式消息路由
  - `src/background/handlers/capture.ts` — 新增区域裁剪逻辑（Canvas 裁剪）
  - `src/popup/App.tsx` — 绑定「选择区域」按钮真实行为
  - `src/shared/messages.ts` — 新增 `CAPTURE_REGION`、`START_CAPTURE` 消息类型
  - `src/shared/types.ts` — 新增 `RegionRect` 类型
  - `manifest.json` — 确认 content_scripts 配置支持注入 CSS
