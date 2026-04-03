# 变更：集成 Editor Hooks 实现 < 500 行目标

## 为什么

Editor 主组件（`App.tsx`）当前有 2,188 行代码，虽然已创建了 6 个独立 Hooks，但尚未集成使用。需要将 Hooks 集成到主组件中，实现真正的模块化架构。

**目标**：将 App.tsx 行数从 2,188 行减少到 < 500 行

## 变更内容

### 1. 集成已创建的 Hooks

将以下 Hooks 集成到 App.tsx，替换原有代码：

| Hook | 替换代码位置 | 预计减少行数 |
|------|-------------|-------------|
| `useKeyboardShortcuts` | 键盘事件处理 | ~80 行 |
| `useCrop` | 裁剪操作 | ~60 行 |
| `useTextEditing` | 文字编辑 | ~120 行 |
| `useShapeDrawing` | 图形绘制状态 | ~200 行 |
| `useShapeDragging` | 图形拖拽 | ~350 行 |
| `useMarqueeSelection` | 框选功能 | ~80 行 |

### 2. 使用 applyDragResize 简化代码

在事件处理中使用 `applyDragResize` 通用函数，减少重复代码约 200 行。

### 3. 提取 JSX 中的 IIFE 为组件

将渲染逻辑中的立即执行函数提取为独立组件：
- `FrameContainer` - 帧容器组件
- `TextEditorInput` - 文字编辑输入组件
- `CropHint` - 裁剪提示组件
- `ZoomControls` - 缩放控制组件

### 4. 优化事件监听器

使用 ref 稳定事件监听器，减少 useEffect 依赖项重绑定。

## 影响

- **受影响规范**：`specs/editor/spec.md`
- **受影响代码**：
  - `src/editor/App.tsx` - 主要重构目标
  - `src/editor/components/` - 新增渲染组件

## 成功标准

- [ ] App.tsx 行数 < 500 行
- [ ] 所有现有测试通过（147 个）
- [ ] 无新增 ESLint 错误
- [ ] 功能行为不变
