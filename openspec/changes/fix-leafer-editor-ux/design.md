## 上下文

CodeFrame 编辑器刚完成纯 Leafer 渲染重构（变更 refactor-canvas-to-leafer），图片+帧+标注全部在 Leafer 内渲染。但当前 Leafer 路径存在多项 UX 问题需要修复：

- 箭头使用 `endArrow: 'mark'`（实心三角形），与直线叠加产生视觉重叠
- 文字编辑时 `TextEditorInput` 组件使用 CSS transform 定位，与 Leafer 坐标系不一致导致偏移
- 马赛克每次拖拽都重新生成整块区域的像素 data URL，无缓存机制
- 裁剪覆盖层仅显示虚线框，不显示裁剪区域实际内容
- 绘制箭头/矩形/马赛克时临时元素使用 `opacity: 0.6` 但无实时更新路径
- 默认样式值（线宽2px、字号24px等）不符合用户预期

约束：仅修改 Leafer 路径代码，Canvas2D 路径保持不变。

## 目标 / 非目标

**目标：**
- 修复箭头、文字、马赛克、裁剪的 UX 问题
- 实现绘制实时预览路径
- 实现选择工具框选
- 调整默认属性值
- 实现工具属性记忆

**非目标：**
- 不修改 Canvas2D 路径代码
- 不修改 Store 核心结构
- 不修改导出逻辑
- 不做性能大幅重构（仅优化马赛克拖拽的明显卡顿）

## 决策

### D1：箭头样式 — 开放 V 形

**选择**：将 `endArrow: 'mark'` 改为 `endArrow: 'arrow'`（Leafer 内置的开放箭头样式），`startArrow: undefined`

**备选**：
- A) 自定义绘制 — 灵活但代码量大
- B) Leafer 内置 `endArrow: 'arrow'` — 简单、与 Leafer 生态一致

**理由**：Leafer 的 `'arrow'` 类型就是开放 V 形，无需自定义。

### D2：绘制预览 — 临时元素实时更新

**选择**：在 `handleDrawPointerMove` 中更新临时元素的坐标/尺寸，而非仅在 PointerUp 时创建最终图形

**当前问题**：`createTempElement` 创建的临时元素 opacity=0.6，`updateTempElement` 已经实现了坐标更新但可能因事件未正确分发而不工作

**修复方向**：确认 PointerEvent.MOVE 事件在 Leafer 中正确触发，临时元素的更新逻辑是否被 syncing 守卫误拦截

### D3：马赛克性能 — 拖拽期间使用防抖

**选择**：拖拽期间使用 Rect 占位（半透明灰色），仅在 DragEnd 时重新生成马赛克 data URL

**理由**：每次移动都重新生成像素 data URL 是卡顿根因。拖拽中用户只需要知道位置，不需要精确马赛克效果。

### D4：裁剪预览 — 半透明遮罩

**选择**：裁剪区域外覆盖半透明黑色遮罩，裁剪区域内显示原始内容

**实现**：在 CropOverlay 中添加四个半透明 Rect（上/下/左/右），围绕裁剪区域排列

### D5：属性记忆 — Store 持久化 lastUsedStyles

**选择**：在 Store 中新增 `lastUsedStyles` 字段，每次图形创建后更新对应工具的样式值。下次使用该工具时从 `lastUsedStyles` 读取默认值。

**备选**：
- A) 每次从最近创建的图形中推断 — 不直观
- B) Store 独立字段 — 简单明确

## 风险 / 权衡

- [箭头样式兼容] 旧数据的箭头使用 `'mark'` 样式，新代码使用 `'arrow'` → 加载旧数据时保持 `style` 字段映射不变
- [马赛克拖拽占位] 拖拽中显示灰色占位而非实际马赛克 → 可接受，DragEnd 后立即恢复真实效果
- [框选复杂度] 框选需要处理跨类型选择 → 复用现有 selectedIds 机制
