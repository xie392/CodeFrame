## 1. 数据模型与常量

- [x] 1.1 定义 `RectShape` 接口（id, x, y, width, height, color, strokeWidth, fillOpacity, borderStyle）
- [x] 1.2 定义 `RectDragType` 类型（none, move, resize-tl, resize-tr, resize-bl, resize-br, resize-t, resize-r, resize-b, resize-l）
- [x] 1.3 定义默认矩形样式常量 `DEFAULT_RECT_STYLE`

## 2. 渲染逻辑

- [x] 2.1 实现 `drawRect` 函数，支持绘制矩形边框和填充
- [x] 2.2 实现选中状态高亮（蓝色高亮边框）
- [x] 2.3 实现选中状态控制点（四个角 + 四条边中点共 8 个控制点）
- [x] 2.4 实现 `renderShapes` 函数，集成画布变换（缩放/平移）

## 3. 交互逻辑 - 绘制矩形

- [x] 3.1 实现矩形工具激活状态管理
- [x] 3.2 实现 mousedown 开始绘制，记录起点
- [x] 3.3 实现 mousemove 实时更新矩形尺寸
- [x] 3.4 实现 mouseup 完成绘制，创建 RectShape 对象
- [x] 3.5 实现最小尺寸校验（宽度或高度小于阈值不创建）

## 4. 交互逻辑 - 选择与编辑

- [x] 4.1 实现 `getRectDragTypeAtPoint` 函数，检测点击位置（控制点/边框/内部/外部）
- [x] 4.2 实现 `isPointInRect` 函数，判断点是否在矩形内
- [x] 4.3 实现矩形移动功能（dragType: move）
- [x] 4.4 实现矩形调整大小功能（dragType: resize-*）
- [x] 4.5 实现选中矩形高亮显示

## 5. 键盘交互

- [x] 5.1 实现 Delete/Backspace 键删除选中的矩形

## 6. 属性面板

- [x] 6.1 添加矩形颜色选择器（复用 ColorPicker 组件）
- [x] 6.2 添加线宽滑块控件（复用 SliderControl 组件）
- [x] 6.3 添加填充透明度滑块控件
- [x] 6.4 添加边框样式切换（实线/虚线）
- [x] 6.5 实现属性变更实时更新矩形

## 7. 状态管理

- [x] 7.1 添加 `rects` 状态（RectShape[]）
- [x] 7.2 添加 `selectedRectId` 状态（string | null）
- [x] 7.3 添加矩形绘制和拖拽相关的 ref
- [x] 7.4 整合到现有画布渲染流程中

## 依赖关系

- 任务 1.x 独立，可先行
- 任务 2.x 依赖 1.1-1.3
- 任务 3.x 依赖 2.1、2.4
- 任务 4.x 依赖 2.2、2.3
- 任务 5.x 依赖 7.1、7.2
- 任务 6.x 依赖 7.1、7.2
- 任务 7.x 独立，可并行
