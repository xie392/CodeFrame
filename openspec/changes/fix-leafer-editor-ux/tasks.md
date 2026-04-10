## 1. 默认样式调整

- [x] 1.1 修改 `src/editor/constants.ts`：`DEFAULT_ARROW_STYLE.strokeWidth` 改为 4，`DEFAULT_RECT_STYLE.strokeWidth` 改为 4，`DEFAULT_TEXT_STYLE.fontSize` 改为 30，`DEFAULT_MOSAIC_STYLE.blockSize` 改为 30，`DEFAULT_MOSAIC_STYLE.opacity` 改为 100
- [x] 1.2 验证默认样式：确认矩形/箭头红色4px、文字红色30px、马赛克30px/100%

## 2. 箭头样式修复

- [x] 2.1 修改 `src/editor/backends/leafer/adapters/arrow-adapter.ts`：将 `endArrow: 'mark'` 改为 `endArrow: 'arrow'`
- [x] 2.2 修改 `src/editor/backends/leafer/leafer-backend.ts`：`createTempElement` 中箭头临时元素的 `endArrow` 也改为 `'arrow'`
- [x] 2.3 验证箭头渲染为开放 V 形（`——>`），无三角形重叠

## 3. 绘制实时预览路径

- [x] 3.1 诊断 `handleDrawPointerMove` 中 PointerEvent.MOVE 事件是否正确触发，检查 syncing 守卫是否误拦截
- [x] 3.2 修复绘制预览：确保 `updateTempElement` 在鼠标移动时被正确调用，临时元素实时更新坐标
- [x] 3.3 验证绘制箭头/矩形/马赛克时鼠标移动过程中实时显示预览图形

## 4. 文字编辑偏移修复

- [x] 4.1 诊断 TextEditorInput 的定位逻辑：检查 CSS transform 中 offset/scale 与 Leafer 坐标系的映射关系
- [x] 4.2 修复文字编辑偏移：确保 TextEditorInput 位置与 Leafer 文字元素位置精确对齐
- [x] 4.3 验证双击文字编辑时画面无偏移，输入框精确定位在文字上方

## 5. 马赛克拖拽性能优化

- [x] 5.1 修改 `listenElementDragEnd` 相关逻辑：在 DragStart 时将马赛克 Image 元素替换为半透明灰色 Rect 占位
- [x] 5.2 在 DragEnd 时恢复马赛克真实像素效果，重新生成 data URL
- [x] 5.3 验证马赛克拖拽流畅无卡顿

## 6. 裁剪增强

- [x] 6.1 修改 `src/editor/backends/leafer/custom/crop-overlay.ts`：添加四个半透明黑色 Rect 作为裁剪区域外遮罩
- [x] 6.2 修改裁剪交互坐标钳制逻辑：将裁剪区域坐标钳制到 `[0, imageWidth] × [0, imageHeight]`
- [x] 6.3 验证裁剪时显示区域内容预览，裁剪区域不可超出图片范围

## 7. 选择工具框选

- [x] 7.1 在 `LeaferBackend` 中实现框选逻辑：select 工具下在空白区域拖拽绘制蓝色虚线选取框
- [x] 7.2 实现框选命中检测：计算选取框与每个标注图形的交集，选中所有相交图形
- [x] 7.3 验证框选功能：拖拽选取框可批量选中箭头/矩形/文字/马赛克

## 8. 工具属性记忆

- [x] 8.1 在 Store 中新增 `lastUsedStyles` 字段，记录每个工具上次使用的样式值
- [x] 8.2 在图形创建后更新 `lastUsedStyles`（从刚创建的图形数据中提取样式）
- [x] 8.3 在 `createTempElement` 和 `createTextAtCoord` 中从 `lastUsedStyles` 读取默认值替代全局常量
- [x] 8.4 实现 `lastUsedStyles` 的 localStorage 持久化（当"保存操作历史"开启时）
- [x] 8.5 验证属性记忆：修改工具属性后切换工具再切回，新图形使用上次设置的属性
