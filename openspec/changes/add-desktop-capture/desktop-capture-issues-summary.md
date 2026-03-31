# 桌面截图功能实现问题总结

## 概述

尝试多次实现桌面截图功能，经历了 11 轮迭代，最终通过 `executeScript` 直接注入目标标签页方案解决。

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

### 方案 7：隐藏标签页 + 内联 JS
**失败原因**：Manifest V3 CSP `script-src 'self'` 禁止内联脚本，JS 从未执行

### 方案 8：隐藏标签页 + 外部 JS 文件
**失败原因**：`chooseDesktopMedia()` 在 Service Worker 中调用缺少 `targetTab` 参数，选择器对话框无法正确显示，回调立即以空字符串触发

### 方案 9：隐藏标签页 + 外部 JS + targetTab 修复
**失败原因**：外部 `capture-page.js` 在 Vite dev 模式下未正确加载，`tabs.sendMessage` 找不到接收端

### 方案 10：executeScript 注入隐藏标签页（chrome-extension://）
**失败原因**：`chrome.scripting.executeScript` 无法注入 `chrome-extension://` 页面 — Chrome API 硬性限制

### 方案 11（最终方案）：executeScript 直接注入目标标签页
**结果**：通过 `chrome.scripting.executeScript({ target: { tabId }, func, args })` 直接在用户当前浏览的标签页中注入截图函数并执行，功能完整

---

## 根本原因分析

### 1. Offscreen Document 的 API 限制

Chrome Offscreen Document 虽然支持 `DISPLAY_MEDIA` reason，但存在关键限制：

- **只支持 `getDisplayMedia()` API**：浏览器原生屏幕共享选择器，无法通过 `chooseDesktopMedia()` 的 streamId 预选源
- **不支持 `getUserMedia()` + `chromeMediaSource: 'desktop'`**：传统桌面捕获方式在 Offscreen Document 上下文中无法启动媒体流
- **`getDisplayMedia()` 在 Offscreen Document 中无法使用**：该 API 需要用户手势（click），Offscreen Document 无法接收用户交互

### 2. Manifest V3 的限制矩阵

| 方案 | CSP 限制 | executeScript 限制 | 结果 |
|------|----------|-------------------|------|
| Offscreen Document + 内联 JS | CSP 不允许内联脚本 | N/A | 失败 |
| Offscreen Document + getUserMedia | N/A | N/A | 不支持 |
| 隐藏标签页 + 外部 JS | `script-src 'self'` 允许 | N/A | dev 模式不可靠 |
| executeScript → chrome-extension:// | N/A | 硬性禁止 | 失败 |
| **executeScript → 目标标签页** | **不涉及** | **允许** | **成功** |

### 3. 构建系统兼容性

`@crxjs/vite-plugin` 对非入口文件的处理方式：
- `web_accessible_resources` 中的 HTML：原样复制，不处理其中引用的脚本
- 非 manifest 入口的 `.ts` 文件：不会被编译
- Vite dev 模式下，非模块图中的静态文件可能无法正确加载

### 4. chooseDesktopMedia 在 Service Worker 中的行为

- 必须传入 `targetTab` 参数，否则选择器对话框不会正确显示
- 回调可能在用户未交互时立即以空字符串触发

---

## 最终方案：executeScript 直接注入目标标签页

### 原理
1. Service Worker 调用 `chrome.desktopCapture.chooseDesktopMedia(sources, targetTab)` 获取 streamId
2. 通过 `chrome.scripting.executeScript({ target: { tabId }, func: captureDesktopStream, args: [streamId] })` 将截图函数注入到用户当前标签页
3. 注入的函数使用 `getUserMedia()` + `chromeMediaSource: 'desktop'` 捕获媒体流
4. 通过 canvas 绘制视频帧并导出为 base64 PNG
5. 返回结果给 Service Worker（executeScript 的返回值机制）

### 优势
- 架构最简洁：无隐藏标签页、无消息传递、无额外 HTML/JS 文件
- `executeScript` 注入是同步完成的，不存在时序问题
- `getUserMedia()` + `chromeMediaSource` 在内容脚本上下文中可正常工作（streamId 已授权）
- 添加 `isCapturing` 防重复保护，避免选择器弹窗两次

### 劣势
- 需要在目标标签页中注入代码（但这是标准做法，不涉及安全风险）
- 受限页面（chrome://、about: 等）无法注入，但 `chooseDesktopMedia` 本身也不适用于这些页面

---

## 涉及文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/background/handlers/desktop-capture.ts` | 重写 | 最终方案：executeScript 注入目标标签页 |
| `src/background/index.ts` | 修改 | 消息处理传入 targetTab，快捷键传入活动标签页 |
| `src/popup/App.tsx` | 修改 | handleDesktopCapture 消息发送 |
| `manifest.json` | 修改 | desktopCapture + tabs + scripting 权限 |
| `src/background/capture-page.html` | 删除 | 不再需要 |
| `src/background/capture-page.js` | 删除 | 不再需要 |
| `src/background/offscreen.html` | 删除 | 早期方案遗留 |
| `src/background/offscreen.ts` | 删除 | 早期方案遗留 |
| `src/background/offscreen.js` | 删除 | 早期方案遗留 |

---

## 参考资料

1. [Chrome Extensions - Offscreen API](https://developer.chrome.com/docs/extensions/reference/api/offscreen)
2. [Chrome Extensions - Desktop Capture API](https://developer.chrome.com/docs/extensions/reference/api/desktopCapture)
3. [Chrome Extensions - Scripting API](https://developer.chrome.com/docs/extensions/reference/api/scripting)
4. [Chrome Extensions - Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/messaging)
5. [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)

---

**总结日期**：2026-03-31
**尝试次数**：11
**最终状态**：executeScript 直接注入目标标签页方案，功能已验证通过
