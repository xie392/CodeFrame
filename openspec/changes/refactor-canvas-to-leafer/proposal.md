## 为什么

编辑器标注渲染层使用原生 Canvas 2D API 手写实现（~2400 行），导致：
1. **事件处理巨石** — `useEditorEvents.ts` 773 行，圈复杂度远超 5，逻辑高度耦合
2. **已有 Bug 难修复** — 马赛克 opacity 初始值错误、默认样式硬编码不一致等问题藏在巨石函数中
3. **扩展性差** — 每新增一种图形需改渲染器、碰撞检测、拖拽逻辑、事件处理、Store 五处
4. **已有死代码** — `useShapeDrawing`/`useShapeDragging`/`useMarqueeSelection` 三个 Hook（~790 行）已抽取但未被使用

此前 Konva.js 迁移失败被回退，核心原因是缺乏隔离层和分阶段验证机制。本次采用**双渲染路径 + 底层抽象 + 分阶段迁移**策略，确保每一步可验证、可回退。

LeaferJS 的 Editor/Arrow/Viewport/Export 插件直接覆盖当前编辑器 80% 的核心需求，且包体积（~100KB gzip）远小于 Fabric.js（~280KB），竞品 ShotEasy 已在同类 Chrome 截图扩展中验证可行性。

## 变更内容

- **新增** LeaferJS 渲染后端（`backends/leafer/`），实现 `IRendererBackend` 接口
- **新增** 渲染后端抽象层（`backends/types.ts`），定义 `IRendererBackend`/`IShapeAdapter`/`IEditorBridge`/`ICoordTransformer` 接口
- **新增** 双渲染路径切换机制（运行时 feature flag，URL 参数 `?leafer=true`）
- **新增** `useBackendSync` Hook，负责 Store ↔ Backend 双向同步
- **新增** `Canvas2DCanvas` 组件，将现有 Canvas 2D 逻辑封装为独立组件（不修改现有代码）
- **新增** `LeaferCanvas` 组件，LeaferJS 渲染路径入口
- **修改** `App.tsx` 精简为渲染路径选择层
- **保留** 现有 Canvas 2D 代码完整不动，作为回退路径
- **保留** Store 数据结构不变（ArrowShape/RectShape/TextShape/MosaicShape），通过适配器映射到 LeaferJS 对象

## 功能 (Capabilities)

### 新增功能
- `renderer-backend`: 渲染后端抽象层 — IRendererBackend 接口、IShapeAdapter 适配器模式、IEditorBridge 选中同步、ICoordTransformer 坐标转换、useBackendSync 桥接 Hook
- `leafer-backend`: LeaferJS 渲染后端实现 — LeaferCanvas 生命周期管理、Shape 适配器（Arrow/Rect/Text/Mosaic）、Editor/Viewport 插件集成、自定义马赛克滤镜、裁剪框 Overlay、导出管线
- `dual-render-switch`: 双渲染路径切换 — 运行时 feature flag、Canvas2DCanvas/LeaferCanvas 组件切换、Store 共享

### 修改功能
- `editor`: 编辑器主组件架构变更 — App.tsx 从直接管理 Canvas 逻辑变为渲染路径选择层，新增 backends 目录和双路径切换，帧容器与 Leafer Canvas 的叠加关系需重新定义

## 影响

- **新增依赖**: `leafer-ui`, `@leafer-in/editor`, `@leafer-in/viewport`, `@leafer-in/arrow`, `@leafer-in/export`, `@leafer-in/filter`（总计 ~100KB gzip）
- **目录结构**: 新增 `src/editor/backends/` 目录（types.ts, canvas2d/, leafer/）
- **组件层**: App.tsx 重构为路径选择层，新增 Canvas2DCanvas 和 LeaferCanvas 组件
- **Store 层**: 数据结构不变，新增 useBackendSync 桥接逻辑
- **导出管线**: Leafer 路径使用 `@leafer-in/export` 替代 CanvasRenderer + snapdom 组合
- **测试**: 新增 backends 层接口测试和 Leafer 适配器测试
- **现有代码**: Canvas 2D 路径代码完整保留，不做任何修改
