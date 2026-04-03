## 修改需求

### 需求：Editor 模块化架构

Editor 组件必须采用模块化架构，将单一巨型组件拆分为多个职责单一的自定义 Hooks 和独立渲染组件。

#### 场景：主组件代码量限制

- **当** Editor 主组件（App.tsx）完成集成重构
- **那么** 主文件代码行数不得超过 500 行
- **且** 每个函数的圈复杂度不得超过 5

#### 场景：Hook 集成完成

- **当** Editor 组件使用自定义 Hooks
- **那么** 必须集成以下 Hooks：
  - `useKeyboardShortcuts` - 键盘快捷键
  - `useCrop` - 裁剪功能
  - `useTextEditing` - 文字编辑
  - `useShapeDrawing` - 图形绘制
  - `useShapeDragging` - 图形拖拽
  - `useMarqueeSelection` - 框选功能
- **且** 每个 Hook 必须通过独立的单元测试

#### 场景：渲染组件提取

- **当** Editor 组件渲染 JSX
- **那么** 必须使用独立组件：
  - `FrameContainer` - 帧容器
  - `TextEditorInput` - 文字编辑输入
  - `CropHint` - 裁剪提示
  - `ZoomControls` - 缩放控制
- **且** 禁止在 JSX 中使用 IIFE

---

## 新增需求

### 需求：Editor 事件监听器稳定

Editor 组件必须优化事件监听器，避免频繁重绑定导致的性能问题。

#### 场景：稳定的鼠标事件监听

- **当** 组件挂载并绑定鼠标事件监听器
- **那么** 必须使用 ref 存储回调函数
- **且** useEffect 依赖项必须限制为仅 `imageData`

#### 场景：事件回调最新状态

- **当** 事件回调执行
- **那么** 必须通过 ref.current 访问最新状态
- **且** 禁止直接使用闭包中的过时状态
