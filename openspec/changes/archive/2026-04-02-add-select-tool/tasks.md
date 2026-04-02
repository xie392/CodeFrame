## 1. 数据结构变更

- [x] 1.1 将选中状态从单个 ID 改为数组：
  - `selectedArrowId` → `selectedArrowIds: string[]`
  - `selectedRectId` → `selectedRectIds: string[]`
  - `selectedTextId` → `selectedTextIds: string[]`
  - `selectedMosaicId` → `selectedMosaicIds: string[]`
- [x] 1.2 更新所有引用这些状态的代码
- [x] 1.3 更新历史记录快照中的选中状态

## 2. 框选功能

- [x] 2.1 添加框选状态：
  - `isMarqueeSelecting: boolean`
  - `marqueeStart: { x: number; y: number }`
  - `marqueeEnd: { x: number; y: number }`
- [x] 2.2 实现框选矩形绘制函数 `drawMarqueeRect()`
- [x] 2.3 实现检测对象是否在框选区域内：
  - `isArrowInRect()`
  - `isRectInRect()`
  - `isTextInRect()`
  - `isMosaicInRect()`
- [x] 2.4 修改 onMouseDown：空白区域开始框选
- [x] 2.5 修改 onMouseMove：更新框选矩形尺寸
- [x] 2.6 修改 onMouseUp：完成框选，选中区域内所有对象

## 3. Shift+点击多选

- [x] 3.1 修改点击事件处理：检测 Shift 键状态
- [x] 3.2 Shift+点击已选中对象：取消该对象选中
- [x] 3.3 Shift+点击未选中对象：添加到选中集合

## 4. 快捷键支持

- [x] 4.1 实现 Ctrl/Cmd+A 全选所有对象
- [x] 4.2 实现 Escape 取消选择
- [x] 4.3 确保输入框聚焦时不触发快捷键

## 5. 批量操作

- [x] 5.1 批量移动：修改拖拽逻辑支持移动所有选中对象
- [x] 5.2 批量删除：修改 Delete/Backspace 删除所有选中对象
- [x] 5.3 批量操作时保持相对位置

## 6. 视觉反馈

- [x] 6.1 所有选中对象同时显示高亮边框
- [x] 6.2 所有选中对象同时显示控制点
- [x] 6.3 框选矩形样式（蓝色半透明边框+填充）
- [x] 6.4 光标样式更新（框选时 crosshair）

## 7. 验证

- [x] 7.1 构建验证
- [x] 7.2 功能验证：
  - 点击单选
  - Shift+点击多选
  - 框选多个对象
  - Ctrl+A 全选
  - Escape 取消选择
  - 批量移动
  - 批量删除
