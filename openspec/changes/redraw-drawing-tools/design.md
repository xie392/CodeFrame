# Design: 重绘绘制工具系统

## 技术栈

- React 19 + TypeScript
- LeaferJS (渲染引擎) + @leafer-in/editor (选中/拖拽/缩放) + @leafer-in/arrow (箭头)
- Zustand (状态管理)
- 当前架构：IRendererBackend 抽象层 + LeaferBackend 实现 + Adapter 模式

## 现有架构分析

```
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│   React UI   │───→│ Zustand Store│───→│ useBackendSync   │
│  (App/Panel) │←───│ (editor-store)│←───│ (双向同步+守卫)   │
└──────────────┘    └──────────────┘    └────────┬─────────┘
                                                  │
                                                  ▼
                                        ┌──────────────────┐
                                        │  LeaferBackend   │
                                        │  ├─ Adapters     │
                                        │  ├─ Bridges      │
                                        │  ├─ ToolBridge   │
                                        │  └─ CropOverlay  │
                                        └──────────────────┘
```

### 核心问题

1. **绘制工具下无法选中图形**：ToolBridge 中，绘制工具设置 `editable=false`，导致 Leafer Editor 不可交互
2. **绘制后自动切回 select 工具**：`onShapeCreated` 回调中 `setActiveTool('select')`
3. **无图层排序**：图形按添加顺序渲染，无 zIndex 概念
4. **裁剪作为工具**：crop 和 arrow/rect 并列在工具栏

## 设计方案

### 1. 统一选中交互（核心变更）

**现状**：绘制工具下 `editable=false`，点击图形无法选中
**目标**：任何工具下点击已有图形自动选中

**方案**：修改 ToolBridge 和绘制交互逻辑

```
新交互优先级（mousedown）：
1. 检测是否命中已有图形 → 是：选中图形（启用 Editor 的 select）
2. 当前是绘制工具 → 否：在空白区域开始绘制
3. 当前是选择工具 → 否：开始框选
```

**关键改动**：
- ToolBridge 不再在绘制模式下完全禁用 Editor
- 改为：绘制模式下 `editable=true`，但监听 Editor 的 SELECT 事件
- 如果 SELECT 触发（用户点击了图形），则进入选中态，不开始绘制
- 如果 mousedown 在空白区域，则禁用 Editor 后开始绘制

具体实现：
```typescript
// ToolBridge 新逻辑
private applyToolMode(): void {
  const ed = editor as { editable: boolean; cancel: () => void };
  
  if (this.currentTool === 'select') {
    ed.editable = true;  // 原样
  } else if (drawingTools.includes(this.currentTool)) {
    // 关键变更：绘制模式下也保持 editable=true
    // 通过 mousedown 事件优先级判定来区分"选中图形"和"开始绘制"
    ed.editable = true;
  } else if (this.currentTool === 'crop') {
    ed.editable = false;
    ed.cancel();
  }
}
```

在 LeaferBackend 的 handleDrawPointerDown 中：
```
1. 先检测 mousedown 位置是否有图形（通过 Leafer 的 hitTest 或遍历 elementMap）
2. 有图形 → 不开始绘制，让 Editor 处理选中
3. 无图形 → 开始绘制临时图形，同时临时设 editable=false 避免选中冲突
```

### 2. 绘制后保持当前工具

**现状**：`onShapeCreated` 回调中 `setActiveTool('select')`
**目标**：绘制完成后保持当前绘制工具，可连续绘制

**改动**：移除 `onShapeCreated` 中的 `setActiveTool('select')` 调用

### 3. 图层排序

**现状**：图形按 Store 数组顺序添加到 annotationBox，无 zIndex
**目标**：支持 zIndex，属性面板可上移/下移

**方案**：

#### 数据模型

在每种图形类型中添加 `zIndex` 字段：

```typescript
// 所有图形共享 zIndex 字段
interface ArrowShape { ...; zIndex: number; }
interface RectShape  { ...; zIndex: number; }
interface TextShape  { ...; zIndex: number; }
interface MosaicShape { ...; zIndex: number; }
```

#### Store 变更

新增操作：
```typescript
// 图层操作（通用，接受图形类型和 id）
moveLayerUp: (type: ShapeType, id: string) => void;
moveLayerDown: (type: ShapeType, id: string) => void;
```

实现：找到目标图形的 zIndex，与相邻图形交换 zIndex 值。

#### Backend 变更

- `addShape` 时根据 zIndex 插入到正确位置（使用 Leafer 的 `addAt` 方法）
- `updateShape` 中 zIndex 变化时重新排序
- 新建图形的 zIndex = 当前最大 zIndex + 1

#### 选中逻辑

按 zIndex 从高到低检测命中。

### 4. 裁剪独立为模态

**现状**：crop 作为 ToolId 在工具栏中切换
**目标**：裁剪是独立模态操作，工具栏有独立入口

**方案**：

#### 数据模型

```typescript
// Store 新增
isCropMode: boolean;
```

#### 工具栏变更

裁剪按钮不再切换 activeTool，而是触发进入裁剪模式：
```
工具栏布局：
[选择] [箭头] [矩形] [文字] [马赛克]
─── 分隔线 ───
[裁剪]   ← 独立按钮，点击进入裁剪模式
─── 分隔线 ───
[撤销] [重做]
```

#### 裁剪模式 UI

进入裁剪模式后：
- 显示裁剪框 + 暗化遮罩
- 显示确认/取消按钮（浮在画布上方）
- 工具栏中裁剪按钮高亮
- 退出模式后恢复之前的活跃工具

#### 裁剪确认逻辑

确认裁剪时：
1. 修改 imageData（裁剪图片）
2. 所有图形坐标偏移（减去裁剪框左上角）
3. 完全在框外的图形删除
4. 重置视口居中

### 5. 缩放模型

**箭头缩放 = 移动端点**：
- 箭头只有起点/终点两个控制点，拖动端点即移动端点
- Leafer Editor 默认会提供包围盒缩放，需禁用，只保留端点拖动
- 实现方式：箭头选中时自定义 Editor 控制点（仅起点+终点），或通过监听 Editor 的 scale 事件映射为端点移动

**文字缩放 = 改变字号**：
- 文字选中时显示4角控制点
- 拖动控制点时，计算缩放比例，映射到 fontSize
- fontSize = Math.round(originalFontSize * scaleRatio)

**矩形/马赛克自由缩放**：
- 8控制点自由缩放（当前已支持）

### 6. ToolId 类型变更

```typescript
// 移除 crop 和 move
export type ToolId = 'select' | 'arrow' | 'rect' | 'text' | 'mosaic';
```

crop 不再是 ToolId，而是独立状态 `isCropMode`。

## 文件变更清单

### 修改文件

| 文件 | 变更内容 |
|------|----------|
| `src/editor/types.ts` | 添加 zIndex 字段；移除 crop/move 的 ToolId；移除 CropDragType |
| `src/editor/store/editor-store.ts` | 添加 zIndex 字段初始化；添加 moveLayerUp/Down；添加 isCropMode；移除 move 工具相关 |
| `src/editor/components/Toolbar/index.tsx` | 移除 move 工具；裁剪按钮改为模式入口；添加快捷键提示 |
| `src/editor/components/PropertiesPanel/index.tsx` | 添加图层上移/下移按钮 |
| `src/editor/App.tsx` | 移除 move cursor 逻辑；裁剪模式 UI；图层操作 |
| `src/editor/backends/leafer/leafer-backend.ts` | 命中检测优先级；绘制模式下选中逻辑；zIndex 排序 |
| `src/editor/backends/leafer/bridges/tool-bridge.ts` | 绘制模式下 editable=true；移除 move/crop 工具模式 |
| `src/editor/backends/hooks/useBackendSync.ts` | 移除绘制后切回 select；zIndex 同步 |
| `src/editor/backends/types.ts` | BackendCallbacks 添加图层操作 |
| `src/editor/hooks/useKeyboardShortcuts.ts` | 更新快捷键映射 |

### 新增文件

| 文件 | 内容 |
|------|------|
| `src/editor/components/CropToolbar/index.tsx` | 裁剪模式浮层（确认/取消按钮） |
| `src/editor/utils/hit-test.ts` | 图形命中检测工具函数 |
| `src/editor/utils/layer-utils.ts` | 图层排序工具函数 |

## 实施顺序

按依赖关系，从底层到上层：

1. **数据模型变更** → types.ts + store + zIndex
2. **命中检测** → hit-test.ts
3. **ToolBridge 重构** → 绘制模式下可选中
4. **LeaferBackend 交互重构** → 优先级判定 + 选中逻辑
5. **图层排序** → layer-utils + store 操作 + backend 同步
6. **裁剪模式独立** → store + UI + 交互分离
7. **工具栏重构** → 移除 move/crop 工具 + 快捷键
8. **属性面板更新** → 图层操作按钮
9. **缩放模型修正** → 箭头端点 + 文字字号映射
