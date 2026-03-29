## 新增需求

### 需求：选择区域按钮行为

Popup 中「选择区域」按钮必须触发区域截图流程，将截图请求路由到 Content Script 进行交互式选区。

#### 场景：点击选择区域按钮

- **当** 用户在 Popup 中点击「选择区域」按钮（Scissors 图标）
- **那么** 必须向 Background Service Worker 发送 `CAPTURE_REQUEST` 消息，payload 为 `{ mode: 'region' }`
- **且** Popup 必须在消息发送后关闭（`setTimeout(window.close, 100)`）

#### 场景：选择区域截图快捷键

- **当** 用户按下 `Alt+Shift+R` 快捷键
- **那么** 必须触发与按钮一致的区域截图流程
- **且** 背景页面区域截图命令处理必须调用区域截图处理函数
