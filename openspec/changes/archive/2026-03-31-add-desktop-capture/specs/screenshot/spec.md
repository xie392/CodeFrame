## 新增需求
### 需求：桌面截图捕获

系统必须支持通过 `chrome.desktopCapture.chooseDesktopMedia` API 让用户选择屏幕、窗口或标签页进行截图，截图结果以 PNG 格式 base64 数据存储。

#### 场景：Popup 按钮触发桌面截图

- **当** 用户在 Popup 中点击「桌面截图」按钮
- **那么** Popup 必须向 Background Service Worker 发送 `CAPTURE_REQUEST` 消息，payload 包含 `mode: 'desktop'`
- **且** Popup 必须在发送消息后立即关闭（`window.close()`）
- **且** Background Service Worker 必须调用 `chrome.desktopCapture.chooseDesktopMedia()` 打开选择器
- **且** 选择器必须显示选项：整个屏幕、窗口、浏览器标签页

#### 场景：快捷键触发桌面截图

- **当** 用户按下 `Alt+Shift+D` 快捷键
- **那么** Background Service Worker 必须触发桌面截图流程
- **且** 流程必须与按钮触发一致

#### 场景：用户选择媒体源

- **当** 用户在选择器中选择媒体源（屏幕/窗口/标签页）
- **那么** Background 必须获取选定的 stream ID
- **且** Background 必须使用 Offscreen Document 通过 `navigator.mediaDevices.getUserMedia` 获取媒体流
- **且** Background 必须等待 Offscreen Document 完全加载后才能发送消息
- **且** Background 必须将媒体流绘制到 Canvas
- **且** Background 必须将 Canvas 导出为 base64 PNG 数据
- **且** 截图完成后必须关闭媒体流

#### 场景：用户取消选择

- **当** 用户在选择器中点击取消或关闭选择器
- **那么** Background 必须取消截图流程
- **且** 不得执行任何截图操作
- **且** 可选地显示取消提示（不阻塞用户）

#### 场景：截图成功

- **当** 媒体流转换为 base64 成功
- **那么** base64 imageData 必须写入 `chrome.storage.local`（key: `codeframe_capture_result`）
- **且** 写入数据必须包含 `success: true`、`imageData`（base64 string）、`timestamp`、`mode: 'desktop'`
- **且** 必须自动打开 Editor 页面

#### 场景：截图失败

- **当** 桌面截图过程中发生错误（如权限被拒绝、API 不支持）
- **那么** 必须将错误信息写入 `chrome.storage.local`
- **且** 数据必须包含 `success: false`、`error`（错误描述 string）、`timestamp`
- **且** 可选地显示错误提示（不阻塞用户）

#### 场景：权限请求

- **当** 用户首次使用桌面截图功能
- **那么** 浏览器必须显示权限请求对话框
- **且** 用户必须授予屏幕共享权限才能继续
- **且** 如果用户拒绝权限，必须显示友好的错误提示

#### 场景：Offscreen Document 同步

- **当** Background 创建或确保 Offscreen Document 存在
- **那么** 必须等待 Offscreen Document 完全加载并准备接收消息
- **且** Background 必须通过消息传递确认 Offscreen Document 已准备就绪
- **且** 准备确认后才能发送截图请求