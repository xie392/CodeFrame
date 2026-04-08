## 新增需求

### 需求:渲染后端抽象接口
系统必须定义 `IRendererBackend` 接口作为所有渲染后端的统一抽象。业务层（App.tsx、Toolbar、PropertiesPanel）禁止直接依赖任何具体渲染引擎 API，只能通过 `IRendererBackend` 接口与渲染层交互。

#### 场景:通过接口创建图形
- **当** 业务层调用 `backend.addShape('rect', id, rectData)`
- **那么** 渲染后端在画布上创建对应图形，且图形 ID 与 Store ID 一致

#### 场景:通过接口更新图形
- **当** Store 中图形属性变化，业务层调用 `backend.updateShape('arrow', id, { color: '#ff0000' })`
- **那么** 渲染后端更新对应图形的视觉表现

#### 场景:通过接口删除图形
- **当** 业务层调用 `backend.removeShape('text', id)`
- **那么** 渲染后端从画布移除对应图形

### 需求:图形适配器模式
系统必须为每种图形类型提供 `IShapeAdapter<TStoreShape>` 适配器，负责 Store 数据结构 ↔ 渲染后端数据结构的双向转换。适配器必须实现 `toCreateParams()`、`toUpdateParams()`、`toStoreUpdates()` 三个方法。

#### 场景:Store 数据转换为后端创建参数
- **当** Store 中新增一个 ArrowShape `{ id: 'a1', startX: 10, startY: 20, endX: 100, endY: 200, color: '#EF4444', ... }`
- **那么** ArrowAdapter.toCreateParams() 将其转换为 Leafer Arrow 构造参数 `{ id: 'a1', points: [10, 20, 100, 200], stroke: '#EF4444', ... }`

#### 场景:后端图形属性转换为 Store 更新
- **当** 用户拖拽 Leafer Arrow 终点，后端触发 onShapeChange 回调
- **那么** ArrowAdapter.toStoreUpdates() 将 Leafer 属性转回 `{ endX: 150, endY: 250 }` 格式写入 Store

### 需求:选中状态桥接
系统必须提供 `IEditorBridge` 接口解决渲染引擎内部选中状态与 Zustand Store selectedXxxIds 的双向同步问题。Store 必须作为选中状态的唯一真实源（Single Source of Truth）。

#### 场景:用户交互触发选中
- **当** 用户点击 Leafer Canvas 上的矩形
- **那么** Leafer Editor 触发选中事件 → IEditorBridge 将选中 ID 写入 Store → PropertiesPanel 显示矩形属性

#### 场景:外部操作触发选中
- **当** 用户按 Ctrl+A 全选
- **那么** Store 更新所有 selectedIds → IEditorBridge 同步到 Leafer Editor 选中状态

#### 场景:防循环同步
- **当** Store → Leafer 同步选中状态时
- **那么** IEditorBridge.isSyncing() 返回 true，Leafer 的选中变化事件禁止回写 Store

### 需求:坐标转换接口
系统必须提供 `ICoordTransformer` 接口，统一处理屏幕坐标 ↔ 图像坐标的转换。业务层禁止直接计算 scale/offset 偏移。

#### 场景:屏幕坐标转图像坐标
- **当** 业务层调用 `transformer.screenToImage(clientX, clientY)`
- **那么** 返回考虑了缩放比例和偏移量的图像坐标

### 需求:Store 与 Backend 双向同步 Hook
系统必须提供 `useBackendSync` Hook，自动将 Store 状态变更同步到 Backend，并将 Backend 用户交互事件回写到 Store。

#### 场景:Store 图形数组变化同步到 Backend
- **当** Store 中 arrows 数组新增一个 ArrowShape
- **那么** useBackendSync 自动调用 `backend.addShape('arrow', id, data)`

#### 场景:Backend 图形变化回写到 Store
- **当** 用户拖拽图形结束后，Backend 触发 onShapeChange 回调
- **那么** useBackendSync 自动更新 Store 中对应图形的坐标/尺寸

### 需求:渲染后端生命周期管理
系统必须通过 `IRendererBackend.init()` 和 `IRendererBackend.destroy()` 管理渲染后端的生命周期。后端初始化必须在容器 DOM 就绪后执行，销毁必须清理所有事件监听和内部状态。

#### 场景:后端初始化
- **当** 组件挂载且容器 DOM 就绪
- **那么** 调用 `backend.init({ container, imageDisplaySize })` 创建 Canvas/Leafer 实例

#### 场景:后端销毁
- **当** 组件卸载
- **那么** 调用 `backend.destroy()` 清理所有资源，无内存泄漏
