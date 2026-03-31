## 新增需求
### 需求：桌面截图按钮行为

Popup 中「桌面截图」按钮必须触发桌面截图流程，使用 Chrome desktopCapture API 捕获屏幕、窗口或标签页。

#### 场景：点击桌面截图按钮

- **当** 用户在 Popup 中点击「桌面截图」按钮（Monitor 图标）
- **那么** 必须向 Background Service Worker 发送 `CAPTURE_REQUEST` 消息，payload 为 `{ mode: 'desktop' }`
- **且** Popup 必须在消息发送后关闭（`setTimeout(window.close, 100)`）
- **且** Background 必须调用 `chrome.desktopCapture.chooseDesktopMedia()` 显示媒体源选择器

#### 场景：桌面截图快捷键

- **当** 用户按下 `Alt+Shift+D` 快捷键
- **那么** 必须触发与按钮一致的桌面截图流程
- **且** Background 必须显示媒体源选择器
