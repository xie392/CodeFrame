## 上下文

Editor 主组件（`src/editor/App.tsx`）当前有 2,188 行代码。第一阶段重构已创建了 6 个独立 Hooks，但尚未集成使用。

## 目标 / 非目标

### 目标
- 将 App.tsx 行数减少到 < 500 行
- 集成已创建的 Hooks
- 保持所有功能不变

### 非目标
- 添加新功能
- 改变现有行为
- 重写核心逻辑

## 决策

### 决策 1：渐进式集成策略

**选择方案**：每个 Hook 独立集成，逐步替换原有代码

**原因**：
- 降低风险，每个变更可独立验证
- 出现问题可快速定位
- 保持 Git 历史清晰

### 决策 2：组件提取策略

**选择方案**：将 JSX 中的 IIFE 提取为独立函数组件

**提取清单**：
```
components/
├── FrameContainer.tsx      # 帧容器（含背景、padding、阴影）
├── TextEditorInput.tsx     # 文字编辑输入框
├── CropHint.tsx            # 裁剪操作提示
└── ZoomControls.tsx        # 缩放控制条
```

### 决策 3：事件处理优化

**选择方案**：使用 ref 存储回调，减少 useEffect 依赖项

```typescript
// 模式
const onDownRef = useSyncedRef(onDown);
const onMoveRef = useSyncedRef(onMove);
const onUpRef = useSyncedRef(onUp);

useEffect(() => {
  const handleDown = (e: MouseEvent) => onDownRef.current(e);
  // ...
}, [imageData]); // 仅依赖 imageData
```

## 架构设计

### 集成后的文件结构

```
src/editor/
├── App.tsx                      # 主容器（< 500 行）
├── hooks/
│   ├── useSyncedRef.ts          # ✅ 已集成
│   ├── useKeyboardShortcuts.ts  # 待集成
│   ├── useCrop.ts               # 待集成
│   ├── useTextEditing.ts        # 待集成
│   ├── useShapeDrawing.ts       # 待集成
│   ├── useShapeDragging.ts      # 待集成
│   └── useMarqueeSelection.ts   # 待集成
├── components/
│   ├── FrameContainer.tsx       # 新增
│   ├── TextEditorInput.tsx      # 新增
│   ├── CropHint.tsx             # 新增
│   └── ZoomControls.tsx         # 新增
└── utils/
    └── drag-resize.ts           # 待使用
```

### App.tsx 预期结构

```typescript
const App: React.FC = () => {
  // 1. Store 状态 (~30 行)
  const { ... } = useEditorStore();

  // 2. Refs (~20 行)
  const canvasRef = useRef<HTMLDivElement>(null);
  // ...

  // 3. 自定义 Hooks (~100 行)
  const { ... } = useZoomPan({ ... });
  const { ... } = useCrop({ ... }, callbacks);
  const { ... } = useTextEditing({ ... }, callbacks);
  const { ... } = useShapeDrawing({ ... }, callbacks, styles, ids);
  const { ... } = useShapeDragging({ ... }, callbacks);
  const { ... } = useMarqueeSelection({ ... }, callbacks);
  useKeyboardShortcuts({ ... }, callbacks);

  // 4. 辅助函数 (~50 行)
  const renderShapes = useCallback(() => { ... }, []);
  const handleImageLoad = useCallback(() => { ... }, []);

  // 5. Effects (~50 行)
  useEffect(() => { ... }, []);

  // 6. 渲染 (~200 行)
  return (
    <div className="editor-container">
      <Toolbar ... />
      <main>
        <FrameContainer>...</FrameContainer>
        <canvas ref={annotationCanvasRef} />
        {editingTextId && <TextEditorInput ... />}
        {activeTool === 'crop' && <CropHint />}
        <ZoomControls />
      </main>
      <PropertiesPanel ... />
    </div>
  );
};
```

## 风险 / 权衡

| 风险 | 缓解措施 |
|------|----------|
| 集成后功能回归 | 每个 Hook 集成后运行完整测试 |
| 闭包问题 | 使用 useSyncedRef 确保最新状态 |
| 性能回归 | 使用 Chrome DevTools 性能分析 |

## 迁移计划

### 阶段 1：简单 Hooks 集成（低风险）
1. 集成 useKeyboardShortcuts
2. 集成 useCrop
3. 集成 useTextEditing

### 阶段 2：复杂 Hooks 集成（中风险）
4. 集成 useShapeDrawing
5. 集成 useShapeDragging
6. 集成 useMarqueeSelection

### 阶段 3：组件提取（低风险）
7. 提取 FrameContainer
8. 提取 TextEditorInput
9. 提取 CropHint
10. 提取 ZoomControls

### 阶段 4：清理和验证
11. 移除冗余代码
12. 运行完整测试
13. 行数验证

## 回滚计划

- 每个 Hook 集成独立提交
- 出现问题可单独 `git revert`
- 保持每个提交可独立编译和测试
