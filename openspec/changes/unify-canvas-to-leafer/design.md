## 上下文

编辑器原有 Canvas2D 和 Leafer 两条渲染路径，通过 Feature Flag (`isLeaferEnabled()`) 切换。Canvas2D 路径是默认稳定路径（DOM+CSS 帧容器 + 原生 Canvas API 标注），Leafer 路径是实验路径（纯 LeaferJS 渲染引擎）。双路径导致大量代码冗余、同步守卫复杂、功能长期不对齐。

当前状态：Canvas2D 专有代码已删除，Leafer 已成为唯一渲染路径，但仍有交互问题待修复。

## 目标 / 非目标

**目标：**
- Leafer 作为唯一渲染后端，功能完全对齐原 Canvas2D 路径
- 消除所有代码冗余（历史记录、视口管理、导出等）
- Store 作为视口状态的单一真相源
- 绘制/选中/拖拽/裁剪交互体验与原 Canvas2D 路径一致
- 马赛克渲染正确无黑色背景

**非目标：**
- 不保留 Canvas2D 路径作为回退方案
- 不重构 App.tsx 的回调中转机制（后续可优化）
- 不改变 Store 的数据模型

## 决策

### 1. 视口管理统一到 Store
useZoomPan 从 `useState` 改为 Store 读写。Canvas2D 路径之前自管理 scale/offset 不经过 Store，导致两条路径视口状态不共享。统一后 Store 成为唯一真相源。

### 2. Leafer App 初始化方式
`new App({ type: 'design' })` 无法正确创建 `app.tree`。改为 `new App({ tree: { type: 'design' }, sky: {} })` 显式配置 tree 和 sky 层。

### 3. 绘制后选中策略
在 `useBackendSync` 的 `onShapeCreated` 回调中，添加 `setSelectedXxxIds` 和 `setActiveTool('select')`。这会触发 selection-effect → `backend.setSelection(ids)` → `editor.select(elements)`。但存在时序问题：新元素可能还未通过 shapes-effect 同步到 Backend 的 elementMap，导致 `editor.select` 找不到元素。

### 4. 裁剪卡顿优化
PointerMove 中只更新 CropOverlay 视觉，不通知 Store。PointerUp 时通过 `notifyCropChange` 通知一次。避免每次 mousemove 都触发 Store→Backend 回环。

### 5. 裁剪后保留标注
按裁剪区域偏移调整标注坐标（减去 cropOffX/cropOffY），并过滤掉裁剪区域外的标注。替代原来的无条件清空方案。

## 风险 / 权衡

- **[选中时序问题]** → `onShapeCreated` 设置 selectedIds 时，对应元素可能还未同步到 Backend → 需要确保 addShape 在 setSelection 之前执行，或在 Backend 中添加延迟选中逻辑
- **[马赛克 Filter 兼容性]** → 透明占位 URL + MosaicFilter 可能导致 Filter 在占位图上应用而非真实图片 → 需要验证 Filter 在 url 更新后是否重新应用
- **[无可回退]** → Canvas2D 代码已删除，如果 Leafer 出现严重问题只能 git revert → 建议在稳定后打 tag
