## 1. 移除拖拽相关代码

- [x] 1.1 移除 `bindCanvasDrag`（画布平移拖拽）的定义及 `{...bindCanvasDrag()}` 绑定
- [x] 1.2 移除 `bindWinDrag`（窗口位置拖拽）的定义及 `{...bindWinDrag()}` 绑定
- [x] 1.3 移除 `spacePressed` 状态变量及 Space 键 `keydown`/`keyup` 监听逻辑
- [x] 1.4 移除 `winPos` 状态变量及其在代码窗口位置计算中的使用
- [x] 1.5 移除画布 `cursor: spacePressed ? 'grab' : 'default'` 样式
- [x] 1.6 移除标题栏 `cursor: 'grab'` 样式
- [x] 1.7 移除 `spacePressed` 控制 `pointer-events-none` 的条件样式

## 2. 确保缩放功能正常

- [x] 2.1 验证滚轮缩放（wheel handler）不受移除影响
- [x] 2.2 验证 UI 缩放控件（放大/缩小按钮、滑块、重置按钮）正常工作
- [x] 2.3 验证 `bindResize`（窗口大小调整）不受移除影响

## 3. 清理与验证

- [x] 3.1 清理移除代码后不再使用的 import（`useDrag` 仍被 `bindResize` 使用，保留）
- [x] 3.2 验证构建通过，无类型错误
- [x] 3.3 确认拖拽功能已完全移除（无 `winPos`/`spacePressed`/`bindCanvasDrag`/`bindWinDrag` 残留）
