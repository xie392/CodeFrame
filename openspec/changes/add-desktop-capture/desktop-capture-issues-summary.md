# 桌面截图功能实现问题总结

## 概述

尝试多次实现桌面截图功能，经历了 7 轮迭代，最终通过隐藏标签页方案解决了问题。

---

## 尝试过的方案

### 方案 1：Offscreen Document + 消息同步
**失败原因**：消息时序问题，OFFSCREEN_READY 消息无法接收

### 方案 2：轮询等待 Offscreen Document
**失败原因**：getContexts 返回存在但消息仍无法发送

### 方案 3：使用 `target: 'offscreen'` 参数
**失败原因**：API 文档与实际行为不一致

### 方案 4：简化为直接发送消息
**失败原因**：Service Worker 与 Offscreen Document 通信机制根本问题

### 方案 5（修复后）：Offscreen Document + 修正 reasons + 内联 JS + sendMessage PING
**失败原因**：Offscreen Document 通信超时 — sendMessage 广播路由不可靠

### 方案 6：Offscreen Document + chrome.runtime.connect() 长连接
**失败原因**：`Error starting tab capture` — Offscreen Document 不支持 `getUserMedia()` + `chromeMediaSource: 'desktop'`，只支持 `getDisplayMedia()` API

### 方案 7（最终方案）：隐藏标签页
**结果**：通信和 getUserMedia 均正常工作，`chooseDesktopMedia()` 回调返回 undefined 的空值保护修复后功能完整

---

## 根本原因分析

### 1. Offscreen Document 的 API 限制（最终定位）

Chrome Offscreen Document 虽然支持 `DISPLAY_MEDIA` reason，但存在关键限制：

- **只支持 `getDisplayMedia()` API**：浏览器原生屏幕共享选择器，无法通过 `chooseDesktopMedia()` 的 streamId 预选源
- **不支持 `getUserMedia()` + `chromeMediaSource: 'desktop'`**：传统桌面捕获方式在 Offscreen Document 上下文中无法启动媒体流
- **`getDisplayMedia()` 在 Offscreen Document 中无法使用**：该 API 需要用户手势（click），Offscreen Document 无法接收用户交互

### 2. 早期方案的其他问题

| 问题 | 影响 |
|------|------|
| `reasons: ['USER_MEDIA']` 无效值 | Offscreen Document 创建失败或权限不正确 |
| `<script type="module" src="./offscreen.ts">` 不被编译 | `@crxjs/vite-plugin` 不处理 `web_accessible_resources` 中 HTML 的脚本，JS 从未执行 |
| `chooseDesktopMedia()` 回调返回 `undefined` | 未做空值保护，`streamId.substring()` 崩溃 |

### 3. 构建系统兼容性

`@crxjs/vite-plugin` 对 `web_accessible_resources` 中的文件处理方式：
- HTML 文件：原样复制，不处理其中引用的脚本
- 非 manifest 入口的 `.ts` 文件：不会被编译
- 解决方案：使用内联 JS 或独立的 `.js`（非 TypeScript）文件

---

## 最终方案：隐藏标签页

### 原理
1. Service Worker 调用 `chrome.desktopCapture.chooseDesktopMedia()` 获取 streamId
2. Service Worker 创建隐藏标签页（`active: false`）加载扩展内 HTML 页面
3. 等待标签页加载完成（`tabs.onUpdated` + status `complete`）
4. 通过 `chrome.tabs.sendMessage()` 发送 streamId 到标签页
5. 标签页内使用 `getUserMedia()` + `chromeMediaSource: 'desktop'` 捕获媒体流
6. 通过 canvas 绘制视频帧并导出为 base64 PNG
7. 返回结果给 Service Worker，关闭标签页

### 优势
- 标签页拥有完整的 DOM 访问和所有媒体 API 权限
- `getUserMedia()` + `chromeMediaSource` 在标签页上下文中正常工作
- `chrome.tabs.sendMessage()` 提供可靠的定向消息传递

### 劣势
- 创建标签页会产生短暂的标签闪烁（`active: false` 可减轻）
- 需要额外的 `tabs` 权限

---

## 涉及文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/background/capture-page.html` | 新增 | 隐藏标签页截图页面（内联 JS） |
| `src/background/handlers/desktop-capture.ts` | 重写 | 改用隐藏标签页方案 |
| `src/background/index.ts` | 修改 | 重新启用桌面截图功能 |
| `src/popup/App.tsx` | 修改 | 重新实现 handleDesktopCapture |
| `manifest.json` | 修改 | `offscreen` → `tabs` 权限，添加 capture-page.html |
| `src/background/offscreen.html` | 删除 | 不再需要 |
| `src/background/offscreen.ts` | 删除 | 不再需要 |
| `src/background/offscreen.js` | 删除 | 不再需要 |

---

## 参考资料

1. [Chrome Extensions - Offscreen API](https://developer.chrome.com/docs/extensions/reference/api/offscreen)
2. [Chrome Extensions - Desktop Capture API](https://developer.chrome.com/docs/extensions/reference/api/desktopCapture)
3. [Chrome Extensions - Messaging](https://developer.chrome.com/docs/extensions/mv3/messaging)
4. [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)

---

**总结日期**：2026-03-30
**尝试次数**：7
**最终状态**：隐藏标签页方案，功能可用，待用户验收
