# 变更：移除 CodeGen 代码编辑器的拖拽功能

## 为什么

代码编辑器（CodeWindow）的拖拽功能（画布平移 + 窗口位置拖拽）实际使用频率极低，增加了不必要的代码复杂度。保留缩放功能即可满足用户调整预览视图的需求。

## 变更内容

- 移除画布平移拖拽（Space + 拖拽 → `bindCanvasDrag`）
- 移除代码窗口位置拖拽（标题栏拖拽 → `bindWinDrag`）
- 移除 `spacePressed` 键盘监听及相关光标样式逻辑
- 移除 `winPos` 状态及其相关计算
- 保留缩放功能（滚轮缩放 + UI 控件缩放）
- 保留窗口大小调整（右下角 resize 手柄 → `bindResize`）

## 影响

- 受影响规范：`codegen`
- 受影响代码：`src/codegen/App.tsx`
  - 移除 `useDrag` 中 `bindCanvasDrag` 和 `bindWinDrag` 的定义及绑定
  - 移除 `spacePressed` 状态、`winPos` 状态
  - 移除 Space 键 `keydown`/`keyup` 监听
  - 移除画布 `cursor: grab` 样式
  - 移除标题栏 `{...bindWinDrag()}` 和 `cursor: 'grab'`
  - 移除 `pointer-events-none` 条件样式
  - 保留 `bindResize`、`zoomAt`、滚轮缩放、UI 缩放控件
