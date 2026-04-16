## 为什么

编辑器存在 Canvas2D 和 Leafer 两条渲染路径，通过 Feature Flag 切换。双路径导致：代码大量冗余（历史记录、视口管理、导出各有两份实现）、Store↔Backend 同步守卫复杂且有调试残留、Leafer 路径功能长期未对齐（缺失 Chrome 快捷键、编辑器初始化、裁剪双击等）、维护成本高且改一处要改两处。需要统一为仅 Leafer 路径，消除冗余和同步问题。

## 变更内容

- **移除 Canvas2D 渲染路径**：删除 Canvas2DCanvas、CanvasRenderer、FrameContainer、useEditorEvents、useExport、useShapeDragging、useShapeDrawing、useMarqueeSelection 及其测试
- **删除 Feature Flag**：移除 feature-flag.ts，Leafer 始终启用
- **合并冗余 Hook**：useLeaferHistory 合并到 useEditorHistory；新增 useEditorActions 共享 pushHistory/undo/redo
- **统一视口管理**：useZoomPan 改为从 Store 读写 scale/offset，作为视口状态单一真相源
- **简化 App.tsx**：移除 isLeafer 分支，始终渲染 LeaferCanvas
- **补齐 Leafer 功能**：Chrome 扩展快捷键、编辑器初始化、裁剪双击应用、裁剪工具切换清空
- **修复 Leafer App 初始化**：`new App({ type: 'design' })` 改为 `new App({ tree: { type: 'design' }, sky: {} })`
- **绘制后自动选中**：onShapeCreated 回调中切换到 select 工具并选中新图形
- **文字编辑隐藏底层**：Backend 添加 setEditingTextId，编辑时隐藏 Leafer Text 元素
- **马赛克黑色背景修复**：MosaicAdapter 设置透明占位 URL
- **裁剪卡顿优化**：PointerMove 中只更新视觉不通知 Store，PointerUp 时通知一次
- **裁剪后保留标注**：按裁剪区域偏移调整标注坐标而非清空
- **移除移动工具按钮**：拖拽已通过空格+鼠标实现，工具栏不再显示 move 按钮

**BREAKING**: Canvas2D 渲染路径完全移除，无法通过 Feature Flag 回退

## 功能 (Capabilities)

### 新增功能
- `leafer-only-renderer`: Leafer 作为唯一渲染后端的完整能力，包括绘制、选中、拖拽、裁剪、导出等

### 修改功能
- `editor`: 渲染路径从双路径切换为 Leafer 单路径；视口管理统一到 Store；历史记录 Hook 合并；裁剪交互优化

## 影响

- **核心代码**：App.tsx、LeaferCanvas、LeaferBackend、useBackendSync、useRendererBackend、useZoomPan、useCrop
- **删除文件**：Canvas2DCanvas、CanvasRenderer、FrameContainer、useEditorEvents、useExport、useShapeDragging、useShapeDrawing、useMarqueeSelection、feature-flag、useLeaferHistory 及其测试
- **依赖**：@zumer/snapdom 仅剩 codegen 模块使用，editor 模块不再依赖
- **遗留问题**：绘制后单击选中/移动标注仍有问题，马赛克渲染仍有问题，需后续修复
