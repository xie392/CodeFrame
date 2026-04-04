## 1. 实施

- [x] 1.1 在 Popup 中引入 `useSettingsStore` 获取 `delayTime` 配置
- [x] 1.2 修改 `handleDelayedCapture` 函数使用设置中的延迟时间
- [x] 1.3 修改延时截图入口的 suffix 显示，展示当前设置的延迟时间
- [x] 1.4 处理设置未加载时的默认值逻辑

## 2. 验证

- [x] 2.1 验证 Popup 延时截图使用设置中的延迟时间
- [x] 2.2 验证在 Options 修改延迟时间后，Popup 显示正确的延迟值
- [x] 2.3 验证设置未加载时使用默认值 3 秒
