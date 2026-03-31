# 变更：实现桌面截图功能

## 为什么

用户希望能够截取整个桌面或特定窗口的截图，不仅限于当前浏览器标签页。当前 Popup 中已有"全屏截图"按钮但未实现，需要将功能落地并统一文案为"桌面截图"。

## 变更内容

- 实现 `chrome.desktopCapture` API 调用，支持选择屏幕、窗口、标签页
- 添加桌面截图的 Background 处理逻辑
- 将"全屏截图"文案统一改为"桌面截图"（Popup 和相关规范）
- 添加桌面截图快捷键支持（Alt+Shift+D）
- 在 screenshot 规范中新增桌面截图需求
- 使用 Offscreen Document 处理媒体流捕获
- 简化消息传递机制，直接使用 `chrome.runtime.sendMessage()` 与 Offscreen Document 通信
- 添加 `offscreen` 和 `desktopCapture` 权限到 manifest.json

## 影响

- **受影响规范**：screenshot, popup
- **受影响代码**：
  - `src/popup/App.tsx` - 修改文案和绑定实际功能
  - `src/background/index.ts` - 添加桌面截图消息处理
  - `src/background/handlers/desktop-capture.ts` - 新增文件，实现桌面截图逻辑
  - `src/background/offscreen.ts` - 新增文件，Offscreen Document 消息处理
  - `src/background/offscreen.html` - 新增文件，Offscreen Document HTML
  - `manifest.json` - 添加桌面截图快捷键命令、offscreen 和 desktopCapture 权限
