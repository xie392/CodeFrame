## 1. 数据结构与常量

- [x] 1.1 定义 `MosaicShape` 接口（id, x, y, width, height, blockSize）
- [x] 1.2 定义 `DEFAULT_MOSAIC_STYLE` 常量（默认方块大小 10px）
- [x] 1.3 定义 `MosaicDragType` 类型（none, move, resize-*）
- [x] 1.4 添加 `generateMosaicId()` 函数

## 2. 绘制功能

- [x] 2.1 实现 `drawMosaic()` 函数 - 在 Canvas 上绘制马赛克效果
- [x] 2.2 实现 `getMosaicHandles()` 函数 - 获取 8 个控制点位置
- [x] 2.3 实现 `isPointInMosaic()` 函数 - 检测点击是否在马赛克区域内
- [x] 2.4 实现 `getMosaicDragTypeAtPoint()` 函数 - 检测拖拽类型

## 3. 状态管理

- [x] 3.1 添加 `mosaics` 状态（MosaicShape[]）
- [x] 3.2 添加 `selectedMosaicId` 状态
- [x] 3.3 添加 `mosaicStyle` 状态（方块大小配置）
- [x] 3.4 添加 `isDrawingMosaic` ref 和 `drawingMosaic` ref
- [x] 3.5 添加 `draggingMosaicRef` ref

## 4. 交互逻辑

- [x] 4.1 实现马赛克工具选中状态（光标变为 crosshair）
- [x] 4.2 实现马赛克绘制交互（mousedown 开始，mousemove 更新，mouseup 创建）
- [x] 4.3 实现马赛克选择功能（点击选中）
- [x] 4.4 实现马赛克移动功能
- [x] 4.5 实现马赛克调整大小功能（8 个控制点）
- [x] 4.6 实现马赛克删除功能（Delete/Backspace 键）

## 5. 属性面板

- [x] 5.1 添加马赛克方块大小滑块控件（范围 5-50px）
- [x] 5.2 实现样式实时预览

## 6. 渲染集成

- [x] 6.1 在 `renderShapes()` 中添加马赛克渲染
- [x] 6.2 处理马赛克绘制预览（拖拽时的临时显示）
- [x] 6.3 确保马赛克在图片上正确显示

## 7. 验证

- [x] 7.1 验证马赛克绘制功能
- [x] 7.2 验证马赛克选择、移动、调整大小
- [x] 7.3 验证马赛克删除功能
- [x] 7.4 验证方块大小配置
