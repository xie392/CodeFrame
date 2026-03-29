## 1. 基础设施

- [x] 1.1 新建 `src/background/handlers/capture.ts`，封装 `captureVisibleTab()` 调用逻辑
- [x] 1.2 新建 `src/shared/stores/capture-store.ts`，创建 Zustand store 管理截图状态（captureStore：capturing、imageData、error）
- [x] 1.3 在 `src/background/index.ts` 中引入 capture handler，实现 `CAPTURE_REQUEST` 消息处理

## 2. Popup 集成

- [x] 2.1 修改 `src/popup/App.tsx`，将"可视截图"按钮的 onClick 从 `console.log` 改为发送 `CAPTURE_REQUEST` 消息并关闭 Popup
- [x] 2.2 注册快捷键 `Alt+Shift+S`（`manifest.json` 中 `capture-visible` 命令 + `src/background/index.ts` 中 `chrome.commands.onCommand` 监听）

## 3. 规范增量

- [x] 3.1 编写 `specs/screenshot/spec.md`，定义可视区域截图的需求和场景
- [x] 3.2 编写 `specs/popup/spec.md` 增量，新增可视截图按钮行为需求

## 4. 验证

- [x] 4.1 手动验证：点击"可视截图"按钮，Popup 关闭，截图数据写入 storage
- [x] 4.2 手动验证：在受限页面（如 chrome:// 页面）点击截图，显示错误提示
- [x] 4.3 手动验证：快捷键 `Alt+Shift+S` 触发截图

## 5. 实施修复

- [x] 5.1 修复 CR 问题：异步错误处理（H1/H2）、windowId 类型检查（H4）、mode 分发（M1）、JSON.parse 防御（M2）
- [x] 5.2 修复 Popup 关闭竞态：`setTimeout(window.close, 100)` + `chrome.runtime.lastError` 日志
- [x] 5.3 截图成功后自动打开 Editor 页面（`src/background/handlers/capture.ts` 中 `openEditor()`）
- [x] 5.4 Editor 页面直接从 `chrome.storage.local` 读取截图结果并展示（绕过 Zustand persist hydration 竞态）
