# Tasks: 重绘绘制工具系统

## 实施阶段

### Phase 1: 数据模型变更

- [x] T1.1 修改 `src/editor/types.ts`
  - 移除 `crop` 和 `move` 的 ToolId，保留 `'select' | 'arrow' | 'rect' | 'text' | 'mosaic'`
  - 移除 `CropDragType`
  - 为 ArrowShape / RectShape / TextShape / MosaicShape 添加 `zIndex: number` 字段
  - 添加 `ShapeType = 'arrow' | 'rect' | 'text' | 'mosaic'` 类型别名

- [x] T1.2 修改 `src/editor/store/editor-store.ts`
  - arrows/rects/texts/mosaics 数组中每项初始化 `zIndex`（默认 0，新图形 = 最大值+1）
  - 添加 `isCropMode: boolean` 状态（默认 false）
  - 添加 `moveLayerUp(type: ShapeType, id: string)` 和 `moveLayerDown(type: ShapeType, id: string)` 方法
  - 添加 `previousTool: ToolId | null`（裁剪模式恢复用）
  - 移除 `move` 工具相关状态（如 moveSelectedIds 等）
  - 移除 `crop` 作为工具的相关逻辑

### Phase 2: 命中检测

- [x] T2.1 新建 `src/editor/utils/hit-test.ts`
  - 实现 `hitTestAtPoint(elements: Map<string, IUI>, point: IPointData): string | null`
  - 按 zIndex 从高到低遍历 elementMap 中的图形，使用 Leafer 的 hitTest 检测
  - 返回最高层命中图形的 id，无命中返回 null

### Phase 3: ToolBridge 重构

- [x] T3.1 修改 `src/editor/backends/leafer/bridges/tool-bridge.ts`
  - 绘制工具模式下不再设置 `editable=false`，改为 `editable=true`
  - 移除 `move` 和 `crop` 工具的分支处理
  - 添加 `isDrawing` 状态标记：绘制开始时临时 `editable=false`，绘制结束后恢复 `editable=true`

### Phase 4: LeaferBackend 交互重构

- [x] T4.1 修改 `src/editor/backends/leafer/leafer-backend.ts`
  - `handleDrawPointerDown` 中先调用 `hitTestAtPoint` 检测命中
  - 命中图形 → 让 Editor 自然处理选中/拖动（不调用 selectShape）
  - 未命中 + 绘制工具 → 设置 `isDrawing=true`，临时 `editable=false`，开始绘制
  - 未命中 + 选择工具 → 开始框选
  - `handleDrawPointerUp` 中重置 `isDrawing=false`，恢复 `editable=true`
  - 移除 `selectShape` 方法（不再需要，Editor 自行处理选中）

- [x] T4.2 修改 `src/editor/backends/hooks/useBackendSync.ts`
  - 移除 `onShapeCreated` 回调中的 `setActiveTool('select')`
  - 添加 zIndex 字段的同步逻辑（Store → Backend 和 Backend → Store）

### Phase 5: 图层排序

- [x] T5.1 新建 `src/editor/utils/layer-utils.ts`
  - `getMaxZIndex(shapes: {zIndex: number}[]): number` — 获取当前最大 zIndex
  - `sortByZIndex(shapes: {zIndex: number}[]): sorted` — 按 zIndex 排序
  - `swapZIndex(shapes, idA, idB)` — 交换两个图形的 zIndex

- [x] T5.2 在 Store 中实现 `moveLayerUp` / `moveLayerDown`
  - `moveLayerUp`: 找到 zIndex 比当前图形大的最近图形，交换 zIndex
  - `moveLayerDown`: 找到 zIndex 比当前图形小的最近图形，交换 zIndex
  - 更新后触发 Backend 同步

- [x] T5.3 修改 LeaferBackend
  - `addShape` 时根据 zIndex 使用 Leafer 的 `addAt` 插入到正确位置
  - `updateShape` 中 zIndex 变化时重新排序子元素
  - 新建图形的 zIndex = `getMaxZIndex() + 1`

### Phase 6: 裁剪模式独立

- [x] T6.1 Store 变更
  - `enterCropMode()`: 保存 `previousTool`，设置 `isCropMode=true`
  - `exitCropMode()`: 恢复 `previousTool`，设置 `isCropMode=false`
  - `confirmCrop(rect: CropRect)`: 执行裁剪逻辑

- [x] T6.2 新建 `src/editor/components/CropToolbar/index.tsx`
  - 浮层组件：确认/取消按钮
  - 仅在 `isCropMode=true` 时渲染

- [x] T6.3 修改 LeaferBackend
  - 裁剪逻辑从工具模式判断改为 `isCropMode` 判断
  - 裁剪确认时：修改 imageData + 坐标偏移 + 删除框外图形

- [x] T6.4 修改 App.tsx
  - 添加 CropToolbar 渲染
  - `isCropMode` 时隐藏正常工具栏高亮

### Phase 7: 工具栏重构

- [x] T7.1 修改 `src/editor/components/Toolbar/index.tsx`
  - 移除 `move` 工具项
  - 裁剪按钮改为模式入口（点击调用 `enterCropMode()`，非切换 activeTool）
  - 添加分隔线分隔绘制工具区和操作区
  - 裁剪按钮在 `isCropMode` 时高亮

- [x] T7.2 修改 `src/editor/hooks/useKeyboardShortcuts.ts`
  - V/Escape → 选择工具
  - A → 箭头工具
  - R → 矩形工具
  - T → 文字工具
  - M → 马赛克工具
  - Esc → 取消选中 / 退出裁剪模式
  - 移除 C → 裁剪工具的映射

### Phase 8: 属性面板更新

- [x] T8.1 修改 `src/editor/components/PropertiesPanel/index.tsx`
  - 选中图形时显示图层上移/下移按钮
  - 按钮调用 `moveLayerUp(selectedType, selectedId)` / `moveLayerDown(selectedType, selectedId)`
  - 多选不同类型时仅显示通用操作（图层 + 删除）

### Phase 9: 缩放模型修正

- [x] T9.1 箭头缩放 = 端点移动
  - 箭头选中时自定义控制点：仅起点+终点两个圆点
  - 禁用箭头的包围盒缩放
  - 拖动端点 → 更新 startPoint/endPoint
  - 拖动中点 → 整体平移
  - 注：Leafer Editor 自动对带 points 的 Arrow 使用 LineEditTool

- [x] T9.2 文字缩放 = 字号映射
  - 文字选中时显示 4 角控制点
  - 拖动控制点时计算缩放比例
  - `fontSize = Math.round(originalFontSize * scaleRatio)`
  - 缩放后更新 Store 中的 fontSize
  - 注：通过设置 editSize: 'font-size' 实现，Leafer Editor 内置支持

## 验证检查点

| 阶段 | 验证方式 |
|------|----------|
| Phase 1 | TypeScript 编译通过，Store 初始化正常 |
| Phase 2 | hitTestAtPoint 单元测试通过 |
| Phase 3 | 绘制工具下点击已有图形可选中 |
| Phase 4 | 箭头工具下：点击图形→选中，点击空白→绘制 |
| Phase 5 | 属性面板上移/下移按钮可改变图形层叠顺序 |
| Phase 6 | 点击裁剪按钮进入模态，确认/取消可退出 |
| Phase 7 | 工具栏无 move/crop，快捷键正常 |
| Phase 8 | 属性面板图层按钮可用 |
| Phase 9 | 箭头缩放=端点移动，文字缩放=字号变化 |
