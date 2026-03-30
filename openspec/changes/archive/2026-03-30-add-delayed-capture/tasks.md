## 1. 基础设施

- [x] 1.1 在 `src/shared/messages.ts` 新增 `START_DELAYED_CAPTURE`、`CAPTURE_DELAYED_READY`、`CANCEL_DELAYED_CAPTURE` 消息类型及对应 Payload 接口
- [x] 1.2 在 `src/shared/constants.ts` 新增延时截图配置常量（倒计时样式、覆盖层颜色等）

## 2. Popup 延时选择交互

- [x] 2.1 实现 `handleDelayedCapture()` 函数，点击后展开延时选项子菜单（3s / 5s / 10s）
- [x] 2.2 替换 `FeatureItem` 中 `console.log('delayed capture')` 为 `handleDelayedCapture`
- [x] 2.3 选择延时后发送 `CAPTURE_REQUEST { mode: 'delayed', delay: N }` 到 Background 并关闭 Popup

## 3. Background 消息处理

- [x] 3.1 在 `src/background/index.ts` 消息路由中新增 `delayed` 模式分支
- [x] 3.2 实现 `handleDelayedCaptureStart(delay: number)`：向 Content Script 发送 `START_DELAYED_CAPTURE { delay }`
- [x] 3.3 在消息路由中新增 `CAPTURE_DELAYED_READY` 处理：调用 `captureVisibleTab()` → 存储 → 打开编辑器

## 4. Content Script 倒计时覆盖层

- [x] 4.1 在 `src/content/index.ts` 新增 `START_DELAYED_CAPTURE` 消息监听
- [x] 4.2 实现倒计时覆盖层 UI：圆形进度环 + 剩余秒数数字，居中显示
- [x] 4.3 实现倒计时逻辑：每秒更新，倒计时结束后发送 `CAPTURE_DELAYED_READY` 到 Background 并移除覆盖层
- [x] 4.4 支持 `Escape` 键取消：发送 `CANCEL_DELAYED_CAPTURE` 到 Background 并移除覆盖层

## 5. 验证

- [x] 5.1 验证构建通过
- [ ] 5.2 验证 3s / 5s / 10s 延时截图完整流程（需手动测试）
- [ ] 5.3 验证倒计时期间 Escape 取消功能（需手动测试）
- [ ] 5.4 验证受限页面（chrome://）的错误处理（需手动测试）
