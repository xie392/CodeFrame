## 1. Phase 0: 底层封装与基础设施

- [ ] 1.1 安装 LeaferJS 依赖：`leafer-ui`、`@leafer-in/editor`、`@leafer-in/viewport`、`@leafer-in/arrow`、`@leafer-in/export`、`@leafer-in/filter`
- [ ] 1.2 创建 `src/editor/backends/types.ts`，定义 `IRendererBackend`、`IShapeAdapter`、`IEditorBridge`、`ICoordTransformer`、`ViewportState`、`BackendConfig`、`ShapeType` 等接口
- [ ] 1.3 创建 `src/editor/backends/feature-flag.ts`，实现 `isLeaferEnabled()` 和 `setLeaferEnabled()` — 优先读 URL 参数 `?leafer=true`，其次读 localStorage `codeframe_use_leafer`，默认 false
- [ ] 1.4 创建 `src/editor/backends/leafer/leafer-app.ts`，封装 Leafer App 生命周期管理（init/destroy/resize），配置 Editor + Viewport 插件，创建标注容器 Box（`overflow: 'hide'`，与图片同尺寸，所有图形添加到此 Box 内）
- [ ] 1.5 创建 `src/editor/backends/leafer/utils/coord-transform.ts`，实现 `ICoordTransformer` — 使用 Leafer zoomLayer 的 scale/x/y 进行坐标转换，绘制坐标钳制到 `[0, imageWidth] × [0, imageHeight]`
- [ ] 1.6 创建 `src/editor/backends/leafer/leafer-backend.ts`，实现 `IRendererBackend` 的生命周期方法（init/destroy/resize/setImageDisplaySize）和视口方法（setViewport/getViewport），图形 CRUD 和事件回调暂用 stub
- [ ] 1.7 创建 `src/editor/backends/leafer/bridges/selection-bridge.ts`，实现 `IEditorBridge` — 包含 isSyncing 守卫防止循环同步
- [ ] 1.8 创建 `src/editor/backends/leafer/bridges/viewport-bridge.ts`，实现视口状态双向同步（Store scale/offset ↔ Leafer zoomLayer）
- [ ] 1.9 创建 `src/editor/backends/leafer/bridges/tool-bridge.ts`，实现工具状态桥接（Store activeTool → Leafer 交互模式切换）
- [ ] 1.10 创建 `src/editor/hooks/useBackendSync.ts`，实现 Store → Backend 单向监听（图形数组/选中状态/视口/工具变化同步到 Backend）
- [ ] 1.11 创建 `src/editor/hooks/useRendererBackend.ts`，根据 feature flag 创建 LeaferBackend 实例，管理生命周期
- [ ] 1.12 将现有 Canvas 2D 逻辑封装为 `src/editor/components/Canvas2DCanvas/index.tsx` 组件 — 内部使用现有 useEditorEvents + CanvasRenderer + useZoomPan，**不修改任何现有代码**，仅包裹
- [ ] 1.13 创建 `src/editor/components/LeaferCanvas/index.tsx` 组件 — 使用 useBackendSync + useRendererBackend，挂载 Leafer App 到容器
- [ ] 1.14 重构 `src/editor/App.tsx` — 精简为渲染路径选择层，根据 isLeaferEnabled() 渲染 Canvas2DCanvas 或 LeaferCanvas，Toolbar/PropertiesPanel/Store 不变
- [ ] 1.15 验证 Phase 0：Canvas 2D 路径功能与当前完全一致；Leafer 路径能渲染空白画布，zoom/pan 通过 Viewport 插件工作；URL 参数切换正常

## 2. Phase 1: 基础图形（Rect + Arrow + Text + Editor 选择/拖拽）

- [x] 2.1 创建 `src/editor/backends/leafer/adapters/rect-adapter.ts`，实现 `IShapeAdapter<RectShape>` — toCreateParams/toUpdateParams/toStoreUpdates，处理 color↔stroke、fillOpacity↔fill、borderStyle↔dash 映射，设置 `dragBounds: 'parent'` 限制拖拽不超出图片边界
- [x] 2.2 创建 `src/editor/backends/leafer/adapters/arrow-adapter.ts`，实现 `IShapeAdapter<ArrowShape>` — 使用 @leafer-in/arrow 的 Arrow 元素，处理 points/startX/startY/endX/endY 和 style(single/double) 映射，设置 `dragBounds: 'parent'`
- [x] 2.3 创建 `src/editor/backends/leafer/adapters/text-adapter.ts`，实现 `IShapeAdapter<TextShape>` — 处理 fontWeight(fontVariant)/fontStyle(italic) 映射，设置 `dragBounds: 'parent'`
- [x] 2.4 实现 `LeaferBackend.addShape/updateShape/removeShape` — 根据 ShapeType 选择对应 adapter，调用 toCreateParams/toUpdateParams，创建/更新/删除 Leafer 元素
- [x] 2.5 实现 `LeaferBackend.setSelection/clearSelection` — 通过 IEditorBridge 同步 Store 选中到 Leafer Editor，使用 startSync/endSync 扩大 syncing 守卫范围
- [x] 2.6 实现 `LeaferBackend.onSelectionChange` — 监听 Leafer Editor 的 SELECT 事件，通过 IEditorBridge 回写 Store
- [x] 2.7 实现 `LeaferBackend.onShapeChange` — 监听 Leafer 元素的 DragEnd 事件，通过 adapter.toStoreUpdates 回写 Store
- [x] 2.8 实现 `LeaferBackend.onShapeCreated` — 监听绘制结束事件，创建 Store 数据并添加到 Store
- [x] 2.9 完善 `useBackendSync` — 实现 Backend → Store 回调（onSelectionChange/onShapeChange/onShapeCreated），改进 Store → Backend 形状同步（hash 检测 + 增量更新）
- [x] 2.10 实现绘制交互 — 监听 Leafer Canvas 的 PointerDown/Move/Up 事件，根据 activeTool 创建临时图形（绘制预览）和最终图形；绘制过程中通过 coordTransform 钳制坐标到 `[0, imageWidth] × [0, imageHeight]`，确保图形不超出图片边界
- [x] 2.11 验证 Phase 1：pnpm build ✅、pnpm test (591 passed) ✅、pnpm test:e2e (19 passed) ✅；安全修复 — 元素事件清理、属性白名单、syncing 守卫范围、类型守卫

## 3. Phase 2: 马赛克（自定义 Filter）

- [ ] 3.1 创建 `src/editor/backends/leafer/custom/mosaic-filter.ts`，通过 `Filter.register('mosaic', ...)` 注册自定义马赛克滤镜 — apply() 中获取 currentCanvas.view（HTMLCanvasElement），使用 getImageData 做像素块平均色计算
- [ ] 3.2 创建 `src/editor/backends/leafer/adapters/mosaic-adapter.ts`，实现 `IShapeAdapter<MosaicShape>` — 创建应用了 MosaicFilter 的 Leafer Image 元素，处理 blockSize 和 opacity（0-100，默认 100）映射，设置 `dragBounds: 'parent'`
- [x] 3.3 实现 LeaferBackend 中马赛克的 CRUD 和绘制交互
- [x] 3.4 修复上传图片后 React 无限循环 — 根因：useRendererBackend 将 imageDisplaySize 作为 useEffect 依赖，size 变化时 backend 被销毁重建触发 sync 循环；修复：用 sizeReady 布尔值替代 imageDisplaySize 作为依赖，size 变化仅走 setImageDisplaySize 热更新；同时 useBackendSync 所有 sync effect 改为直接依赖 backend 参数（修复 backend 重建后状态丢失），回调添加值比对防止异步 Leafer 事件触发无意义 store 更新
- [ ] 3.5 验证 Phase 2：马赛克绘制效果与 Canvas 2D 路径视觉一致，opacity 初始值为 100，右侧面板 blockSize/opacity 控件正常工作

## 4. Phase 3: 裁剪框（自定义 Overlay）

- [ ] 4.1 创建 `src/editor/backends/leafer/custom/crop-overlay.ts`，实现裁剪框覆盖层 — 半透明遮罩 + 裁剪区域透明 + 三分线 + 8 个控制点 + 拖拽调整
- [ ] 4.2 实现 `LeaferBackend.setCropArea/onCropAreaChange` — 裁剪区域与 Store cropArea 双向同步
- [ ] 4.3 实现裁剪绘制交互 — crop 工具下拖拽绘制裁剪区域，支持拖拽调整和键盘快捷键（Enter 应用/Esc 取消）
- [ ] 4.4 适配 `useCrop.ts` Hook — 裁剪应用逻辑从 Canvas 像素操作改为使用 Leafer 导出 + Canvas 裁剪
- [ ] 4.5 验证 Phase 3：裁剪框绘制/调整/应用/取消功能完整，裁剪结果与 Canvas 2D 路径一致

## 5. Phase 4: 导出管线 + 撤销重做

- [ ] 5.1 创建 `src/editor/backends/leafer/hooks/useLeaferExport.ts`，使用 @leafer-in/export 实现标注层导出 — leafer.export('png'/'jpg'/'webp', { blob: true, pixelRatio })
- [ ] 5.2 实现分层导出合成 — 帧容器用 snapdom 截取（底层），标注层用 Leafer Export 导出（上层），合成最终图片
- [ ] 5.3 适配 `useExport.ts` — 根据 feature flag 选择 Canvas 2D 导出管线或 Leafer 导出管线
- [ ] 5.4 创建 `src/editor/backends/leafer/hooks/useLeaferHistory.ts`，利用 Leafer JSON 序列化实现撤销/重做 — 保存 Leafer 状态快照到历史栈
- [ ] 5.5 适配 `useEditorHistory.ts` — 根据 feature flag 选择 Canvas 2D 历史或 Leafer 历史
- [ ] 5.6 验证 Phase 4：导出 PNG/JPG/WebP 质量/尺寸正确，复制到剪贴板正常，撤销/重做功能完整

## 6. Phase 5: 集成验证与清理

- [ ] 6.1 全功能回归测试 — 在 Leafer 路径下测试所有编辑器功能（绘制/选中/拖拽/缩放/框选/裁剪/导出/撤销重做/快捷键）
- [ ] 6.2 导出质量对比测试 — Leafer 导出 vs Canvas 2D 导出，像素级比对
- [ ] 6.3 性能对比测试 — Leafer vs Canvas 2D 在大图（4K）+ 多标注（50+）场景下的帧率和响应时间
- [ ] 6.4 Chrome 扩展 CSP 兼容性测试 — 验证 LeaferJS 在 Manifest V3 环境下无 CSP 违规
- [ ] 6.5 包体积评估 — 测量 Leafer 插件实际 gzip 体积，确认在可接受范围内
- [ ] 6.6 如果 Phase 5 验证全部通过：将 feature flag 默认值改为 true（Leafer 为默认路径）
- [ ] 6.7 如果 Phase 5 验证全部通过且稳定运行一周：删除 Canvas 2D 后端代码（backends/canvas2d/）、CanvasRenderer、shape-helpers、drag-resize、useEditorEvents 及其测试文件
- [ ] 6.8 清理空目录（services/shape-sync/、types/、components/konva-shapes/）和未使用的 Hooks（useShapeDrawing、useShapeDragging、useMarqueeSelection）
