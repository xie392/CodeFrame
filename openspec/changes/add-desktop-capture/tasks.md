## 1. 实施

- [x] 1.1 在 Background 中创建桌面截图处理器（`src/background/handlers/desktop-capture.ts`）
  - 使用 `chrome.desktopCapture.chooseDesktopMedia` API
  - 处理用户选择（screen/window/tab）
  - 使用 Offscreen Document 获取媒体流
  - 将媒体流转换为 Canvas 并导出为 base64
  - 保存截图结果到 `chrome.storage.local`
  - 截图成功后自动打开 Editor 页面

- [x] 1.2 在 Background index 中注册桌面截图消息处理
  - 添加 `CAPTURE_REQUEST` 消息监听，处理 `mode: 'desktop'`
  - 调用桌面截图处理器
  - 返回截图结果给调用方

- [x] 1.3 修改 Popup 组件实现桌面截图功能
  - 将"全屏截图"文案改为"桌面截图"
  - 实现 `handleDesktopCapture` 函数
  - 向 Background 发送 `CAPTURE_REQUEST` 消息（mode: 'desktop'）
  - 处理截图响应

- [x] 1.4 更新 manifest.json 添加桌面截图快捷键
  - 在 `commands` 中添加 `capture-desktop` 命令
  - 设置快捷键为 `Alt+Shift+D`
  - 添加描述为"桌面截图"
  - 添加 `offscreen` 权限以支持 Offscreen Document
  - 添加 `desktopCapture` 权限到 `permissions`（非可选）

- [x] 1.5 更新 screenshot 规范添加桌面截图需求
  - 新增"需求：桌面截图捕获"
  - 定义多个场景：Popup 触发、快捷键触发、媒体流转换、受限处理等

- [x] 1.6 更新 popup 规范修改文案
  - 将"全屏截图"改为"桌面截图"
  - 更新相关需求中的按钮标签文案

- [x] 1.7 修复 Offscreen Document 通信问题
  - **根因 1**：`chrome.offscreen.createDocument()` 的 `reasons` 参数使用了无效值 `'USER_MEDIA'`，修正为 `'DISPLAY_MEDIA'`
  - **根因 2**：`offscreen.html` 通过 `<script type="module" src="./offscreen.ts">` 引用 TypeScript 模块，但 `@crxjs/vite-plugin` 不处理 `web_accessible_resources` 中 HTML 文件的脚本编译，导致 JS 永远不会执行，消息监听器从未注册
  - **修复方案**：
    - 将 `offscreen.html` 的 JavaScript 改为内联（避免构建系统兼容性问题）
    - 修正 `reasons` 为 `'DISPLAY_MEDIA'`
    - 添加 `sendMessage()` 重试机制（最多 5 秒）确保 Offscreen Document JS 加载完成后再发送消息
    - 截图完成后自动关闭 Offscreen Document 释放资源

---

## 问题总结（已修复）

### 尝试次数：4 次均失败 → 已通过根因分析修复

| 次数 | 方案 | 错误信息 | 根因 |
|------|------|---------|------|
| 1 | Offscreen Document + 消息同步 | Offscreen Document 初始化超时 | offscreen.ts 未被编译，JS 从未执行 |
| 2 | 轮询等待 Offscreen Document | Offscreen Document 创建超时 | reasons 参数无效，createDocument 可能失败 |
| 3 | 使用 `target: 'offscreen'` 参数 | Could not establish connection. Receiving end does not exist | JS 从未执行，无消息监听器 |
| 4 | 简化直接发送消息 | Could not establish connection. Receiving end does not exist | 同上 |

### 两个关键根因

1. **`reasons: ['USER_MEDIA']` 无效**：Chrome Offscreen API 的有效 reasons 为 `CLIPBOARD`、`AUDIO_PLAYBACK`、`DISPLAY_MEDIA`、`DOM_SCRAPING`、`TESTING` 等，不含 `USER_MEDIA`
2. **构建系统不处理 offscreen.html 的脚本**：`@crxjs/vite-plugin` 不编译 `web_accessible_resources` 中 HTML 文件引用的 TypeScript 模块，`<script type="module" src="./offscreen.ts">` 导致浏览器加载 TypeScript 原文而无法执行
