## 新增需求

### 需求：Editor 数据安全验证

Editor 组件必须对从 Chrome Storage 获取的数据进行运行时类型验证，防止无效数据导致的运行时错误。

#### 场景：验证截图数据格式

- **当** 从 Chrome Storage 获取截图结果数据
- **那么** 必须验证数据类型为 `{ success: boolean; imageData?: string; error?: string }`
- **且** 如果数据格式无效，必须设置错误状态并显示错误信息

#### 场景：验证图片数据格式

- **当** 数据包含 `imageData` 字段
- **那么** 必须验证 `imageData` 以 `data:image/` 开头
- **且** 如果格式无效，必须显示"无效的图片数据格式"错误

---

### 需求：Editor 模块化架构

Editor 组件必须采用模块化架构，将单一巨型组件拆分为多个职责单一的自定义 Hooks。

#### 场景：主组件代码量限制

- **当** Editor 主组件（App.tsx）完成重构
- **那么** 主文件代码行数不得超过 500 行
- **且** 每个函数的圈复杂度不得超过 5

#### 场景：Hook 职责划分

- **当** 实现图形相关功能
- **那么** 必须使用以下 Hooks：
  - `useShapeDrawing` - 图形绘制状态管理
  - `useShapeDragging` - 图形拖拽逻辑
  - `useMarqueeSelection` - 框选功能

#### 场景：独立功能 Hook 化

- **当** 实现独立功能
- **那么** 必须使用以下 Hooks：
  - `useKeyboardShortcuts` - 键盘快捷键
  - `useCrop` - 裁剪功能
  - `useTextEditing` - 文字编辑
  - `useImageLoading` - 图片加载

---

### 需求：Editor 性能优化

Editor 组件必须优化渲染性能，避免不必要的重渲染和事件监听器重建。

#### 场景：稳定的事件监听器

- **当** 组件挂载并绑定事件监听器
- **那么** 必须使用 ref 存储回调函数
- **且** useEffect 依赖项必须限制为仅 `imageData`

#### 场景：深拷贝性能优化

- **当** 保存历史记录状态
- **那么** 必须使用 `structuredClone` 进行深拷贝
- **且** 禁止使用 `JSON.parse(JSON.stringify())` 方式

---

### 需求：Editor 代码规范

Editor 组件必须遵循代码规范，消除代码重复和魔术数字。

#### 场景：通用拖拽函数

- **当** 实现图形拖拽调整大小功能
- **那么** 必须使用通用的 `applyDragResize` 函数
- **且** 该函数必须支持矩形、马赛克、裁剪框的通用调整逻辑

#### 场景：命名常量使用

- **当** 代码中使用数值常量
- **那么** 必须提取为命名常量
- **且** 常量命名必须语义清晰（如 `DRAW_MIN_DISTANCE` 而非 `MIN_DIST`）

#### 场景：Ref 同步工具

- **当** 需要同步 React State 和 Ref
- **那么** 必须使用 `useSyncedRef` Hook
- **且** 禁止手动编写 `ref.current = value` 同步代码
