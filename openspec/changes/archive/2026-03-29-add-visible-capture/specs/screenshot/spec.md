## 新增需求

### 需求：可视区域截图捕获

系统必须支持通过 `chrome.tabs.captureVisibleTab()` API 捕获当前活动标签页的可视区域截图，截图结果以 PNG 格式 base64 数据存储。

#### 场景：Popup 按钮触发截图

- **当** 用户在 Popup 中点击"可视截图"按钮
- **那么** Popup 必须向 Background Service Worker 发送 `CAPTURE_REQUEST` 消息，payload 包含 `mode: 'visible'`
- **且** Popup 必须在发送消息后立即关闭（`window.close()`）
- **且** Background Service Worker 必须调用 `chrome.tabs.captureVisibleTab()` 捕获当前标签页
- **且** 截图完成后必须将 base64 imageData 写入 `chrome.storage.local`（key: `codeframe_capture_result`）

#### 场景：快捷键触发截图

- **当** 用户按下 `Alt+Shift+S` 快捷键
- **那么** Background Service Worker 必须触发可视区域截图
- **且** 截图流程必须与按钮触发一致

#### 场景：截图成功

- **当** `chrome.tabs.captureVisibleTab()` 成功返回 dataURL
- **然后** 必须 `Base64` 编码后的截图数据写入 `chrome.storage.local`
- **且** `write` 数据必须包含 `success: true`、`imageData`（base64 string）、`timestamp`

#### 场景：截图失败

- **当** `chrome.tabs.captureVisibleTab()` 调用失败（如受限页面 chrome://、about:）
- **那么** 必须 `将` 错误信息写入 `chrome.storage.local`
- **且** `数据` 必须包含 `success: false`、`error`（错误描述 string）、`timestamp`

#### 场景：受限页面处理

- **当** 当前标签页为受限页面（chrome://、chrome-extension://、about:、devtools://）
- **那么** 系统禁止尝试截图
- **且** 必须在 `storage` 中写入错误结果 `error` 包含"受限页面不支持截图"提示

### 需求：截图状态管理

系统必须使用 Zustand store 管理截图状态，并通过 `chrome.storage.local` 实现跨上下文持久化。

#### 场景：截图中状态

- **当** 截图请求已发送但尚未完成
- **那么** capture store 的 `capturing` 状态必须为 `true`

#### 场景：截图完成状态

- **当** 截图成功完成
- **那么** capture store 的 `capturing` 必须为 `false`
- **且** `imageData` 必须包含截图 base64 数据
- **且** `error` 必须为 `null`

#### 场景：截图错误状态

- **当** 截图失败
- **那么** capture store 的 `capturing` 必须为 `false`
- **且** `imageData` 必须为 `null`
- **且** `error` 必须包含错误描述字符串
