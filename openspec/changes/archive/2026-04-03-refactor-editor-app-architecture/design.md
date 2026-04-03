## 上下文

Editor 主组件（`src/editor/App.tsx`）是一个 2152 行的 React 函数组件，负责：

- 图片加载和显示
- 四种图形绘制（箭头、矩形、文字、马赛克）
- 图形选择和拖拽
- 裁剪功能
- 历史记录管理
- 导出功能
- 缩放和平移
- 键盘快捷键
- 操作历史持久化

当前实现导致严重的维护和性能问题。

## 目标 / 非目标

### 目标
- 提升代码可维护性和可测试性
- 优化渲染性能
- 增强数据安全验证
- 减少代码重复

### 非目标
- 改变现有功能行为
- 重写核心业务逻辑
- 更改外部 API 接口

## 决策

### 决策 1：按职责拆分自定义 Hooks

**选择方案**：将事件处理逻辑拆分为独立的自定义 Hooks

**原因**：
- 每个 Hook 职责单一，易于测试
- 减少主组件代码量
- 提高代码复用性

**替代方案**：
- 方案 A：拆分为子组件 → 拒绝，Canvas 绑定逻辑不适合组件化
- 方案 B：使用 Context 分发状态 → 拒绝，增加复杂度，当前 Zustand 已足够

### 决策 2：使用 useRef 稳定事件监听器

**选择方案**：使用 ref 存储回调，减少 useEffect 依赖项

```typescript
// 稳定的 ref 回调模式
const onDownRef = useRef(onDown);
onDownRef.current = onDown;

useEffect(() => {
  const handleDown = (e: MouseEvent) => onDownRef.current(e);
  el.addEventListener('mousedown', handleDown);
  return () => el.removeEventListener('mousedown', handleDown);
}, [imageData]); // 仅依赖 imageData
```

**原因**：
- 避免每次操作都重新绑定事件
- 减少内存分配

### 决策 3：提取通用拖拽函数

**选择方案**：创建 `applyDragResize` 通用函数

**原因**：
- 矩形、马赛克、裁剪框拖拽逻辑几乎相同
- 减少约 200 行重复代码

### 决策 4：使用 structuredClone 替代 JSON 序列化

**选择方案**：使用原生 `structuredClone` API

**原因**：
- 性能更好（原生实现）
- 支持更多数据类型（Map、Set、Date 等）
- Chrome 88+ 已支持

**替代方案**：
- lodash.cloneDeep → 需要额外依赖
- 保持现状 → 性能较差

## 架构设计

### 文件结构

```
src/editor/
├── App.tsx                      # 主容器组件
├── hooks/
│   ├── index.ts                 # 导出入口
│   ├── useShapeDrawing.ts       # 图形绘制
│   ├── useShapeDragging.ts      # 图形拖拽
│   ├── useCrop.ts               # 裁剪功能
│   ├── useTextEditing.ts        # 文字编辑
│   ├── useKeyboardShortcuts.ts  # 键盘快捷键
│   ├── useMarqueeSelection.ts   # 框选功能
│   ├── useImageLoading.ts       # 图片加载
│   └── useSyncedRef.ts          # Ref 同步工具
├── utils/
│   ├── editor.ts                # 现有工具函数
│   ├── shape-helpers.ts         # 现有图形辅助
│   └── drag-resize.ts           # 新增：通用拖拽
└── constants.ts                 # 新增：命名常量
```

### Hook 职责划分

| Hook | 职责 | 输入 | 输出 |
|------|------|------|------|
| `useShapeDrawing` | 图形绘制状态管理 | activeTool, coord | 绘制状态 Refs |
| `useShapeDragging` | 图形拖拽逻辑 | 选中状态, coord | 更新函数 |
| `useCrop` | 裁剪功能 | cropArea, coord | applyCrop, cancelCrop |
| `useTextEditing` | 文字编辑 | editingTextId | 编辑状态和回调 |
| `useKeyboardShortcuts` | 快捷键 | 各状态 | 事件监听 |
| `useMarqueeSelection` | 框选 | coord | 选择状态 |
| `useImageLoading` | 图片加载 | source | imageData, handlers |
| `useSyncedRef` | Ref 同步 | value | 同步后的 Ref |

### 数据流

```
┌─────────────────────────────────────────────────────────────┐
│                        Zustand Store                         │
│  (arrows, rects, texts, mosaics, selectedIds, cropArea...)  │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │ useShape    │  │ useCrop     │  │ useKeyboard │
     │ Drawing     │  │             │  │ Shortcuts   │
     └─────────────┘  └─────────────┘  └─────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
                    ┌─────────────────┐
                    │  renderShapes   │
                    │  (Canvas 绘制)  │
                    └─────────────────┘
```

## 风险 / 权衡

| 风险 | 缓解措施 |
|------|----------|
| 重构引入 Bug | 每个 Hook 独立测试，保持现有测试覆盖 |
| 闭包问题 | 使用 ref 存储最新状态，避免过时闭包 |
| 学习成本 | 提供清晰的文档和示例 |

## 迁移计划

### 阶段 1：安全修复（低风险）
1. 添加 Chrome Storage 数据验证
2. 提取魔术数字为常量

### 阶段 2：工具函数提取（低风险）
1. 创建 `useSyncedRef` Hook
2. 创建 `applyDragResize` 通用函数
3. 替换 `JSON.parse(JSON.stringify())` 为 `structuredClone`

### 阶段 3：Hook 拆分（中风险）
1. 拆分 `useKeyboardShortcuts`
2. 拆分 `useCrop`
3. 拆分 `useShapeDrawing`
4. 拆分 `useShapeDragging`
5. 拆分 `useMarqueeSelection`

### 阶段 4：性能优化（低风险）
1. 使用 ref 稳定事件监听器
2. 减少 useEffect 依赖项

### 回滚计划
- 每个 Hook 独立提交
- 出现问题可单独回滚
- 保持 Git 历史清晰

## 待决问题

1. **是否需要添加 E2E 测试？** → 建议在重构后添加关键路径 E2E 测试
2. **是否需要更新文档？** → 是，需要更新组件文档和开发指南
