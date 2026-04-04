# 变更：Popup 延时截图使用设置中的延迟时间

## 为什么

当前 Popup 中延时截图功能使用硬编码的 `DEFAULT_DELAY = 3` 秒，而 Options 设置页已提供「延迟截图时间」配置（3秒/5秒/10秒），两者未关联。用户在设置页修改延迟时间后，Popup 中的延时截图不会使用该设置，导致设置无效。

## 变更内容

- Popup 延时截图功能读取 `settings.delayTime` 配置，替代硬编码值
- Popup 延时截图入口显示当前设置的延迟时间（如「3s」）
- 若设置未加载或为空，使用默认值 3 秒

## 影响

- 受影响规范：popup（修改「延时截图入口行为」需求）
- 受影响代码：`src/popup/App.tsx`
- 受影响存储：`settings-store.ts` 中的 `delayTime`
