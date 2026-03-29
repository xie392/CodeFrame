## 上下文

CodeFrame 是 Chrome Extension Manifest V3 项目，采用 Popup → Background Service Worker → Content Script 三层通信架构。可视区域截图是截图功能中最简单的模式，使用 Chrome 原生 API `chrome.tabs.captureVisibleTab()` 即可完成，无需 Content Script 参与。

当前代码状态：
- Popup 中"可视截图"按钮：`console.log('visible capture')` 占位
- Background SW：`CAPTURE_REQUEST` case 为 TODO
- Content Script：`START_CAPTURE` case 为 TODO（本次不需要改动）
- 类型定义已就绪：`CaptureOptions`、`CaptureResult`、`CaptureRequestPayload`、`CaptureResultPayload`

## 目标 / 非目标

- 目标：
  - 实现从 Popup 点击"可视截图"到获得 base64 截图数据的完整链路
  - Popup 关闭后截图仍能完成（通过 Background SW 异步处理）
  - 截图结果存入 Zustand store，供后续 Editor 使用
  - 通过快捷键 `Alt+Shift+S` 也能触发可视区域截图
- 非目标：
  - 不实现 Editor 打开/渲染截图（后续变更）
  - 不实现区域截图、整页截图（后续变更）
  - 不实现截图后的导出/保存功能
  - 不实现延时截图（后续变更）

## 决策

### 决策 1：截图执行位置 — Background Service Worker

- **选择**：在 Background Service Worker 中直接调用 `chrome.tabs.captureVisibleTab()`
- **原因**：
  - `captureVisibleTab()` 只能在 Background SW 中调用（Manifest V3 限制）
  - Popup 关闭后 SW 仍然存活（Chrome 30s 超时足够完成截图）
  - 无需 Content Script 中转，架构更简单
- **替代方案**：
  - Content Script 中转：多一跳延迟，且 Content Script 无法调用 `captureVisibleTab()`，排除
  - Offscreen Document：MV3 支持但增加复杂度，可视区域截图不需要 DOM 操作，排除

### 决策 2：Popup 关闭时机 — 先关闭再截图

- **选择**：Popup 先关闭，然后 Background SW 执行截图
- **原因**：
  - 避免 Popup 本身被截入画面
  - `window.close()` 后消息已发送，SW 异步处理不依赖 Popup 存活
- **替代方案**：
  - 先截图再关闭：Popup 可能出现在截图中，体验差

### 决策 3：截图结果传递 — Zustand Store

- **选择**：截图结果存入 Zustand store（通过 `chrome.storage.local` 持久化）
- **原因**：
  - Popup 关闭后内存 store 丢失，需要持久化
  - Background SW 无法直接写入 Popup 内存
  - Zustand persist 中间件 + `chrome.storage.local` 实现跨上下文状态共享
- **流程**：Popup 发消息 → SW 截图 → SW 写 storage → Popup/Editor 下次打开时从 store 读取

### 决策 4：消息协议 — 复用已有类型

- **选择**：复用 `src/shared/messages.ts` 中已有的 `CAPTURE_REQUEST` / `CAPTURE_RESULT` 消息类型
- **原因**：类型已定义且符合需求，无需新增消息类型

## 风险 / 权衡

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| `captureVisibleTab()` 在受限页面（chrome://、about:）报错 | 无法截图 | 捕获错误并通过 toast 提示用户 |
| SW 30s 超时导致截图未完成 | 用户无反馈 | `captureVisibleTab()` 通常 <100ms，风险极低 |
| Popup 关闭后无 UI 反馈截图进度 | 用户困惑 | 后续通过 Editor 打开时自然反馈；本次暂不处理 |

## 迁移计划

无需迁移，此为新功能。现有骨架代码（TODO 注释）直接替换为实际实现。

## 待决问题

- 截图完成后是否需要播放系统通知提醒用户？（建议本次不实现，保持简洁）
- Editor 页面尚未实现，截图数据暂存 storage，是否需要设置过期清理？（建议暂不处理）
