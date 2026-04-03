## 上下文

### 当前问题

`src/editor/App.tsx` 是一个 5988 行的巨型单体文件，包含：

| 职责 | 行数 | 问题 |
|------|------|------|
| 常量定义 | ~350 | 应抽取到独立文件 |
| Canvas 绑定函数 | ~900 | 应封装为服务 |
| 子组件定义 | ~1500 | 应拆分为独立文件 |
| 状态管理 | ~300 | 30+ useState 分散 |
| 事件处理 | ~900 | onMove 函数超长 |
| 主组件渲染 | ~2000 | 逻辑与 UI 耦合 |

### 约束

1. **功能不变**：重构不改变任何用户可见的功能
2. **渐进式**：分阶段进行，每阶段可独立验证
3. **向后兼容**：保持导出接口兼容
4. **测试覆盖**：重构过程中增加测试

## 目标 / 非目标

### 目标

- 将 `App.tsx` 拆分为 < 200 行的入口文件
- 创建清晰的模块边界和职责分离
- 提取可复用的 Hooks 和服务
- 使用 Zustand 统一状态管理
- 提高代码可测试性

### 非目标

- 不改变任何用户可见的功能
- 不引入新的依赖（除 Zustand，已安装）
- 不优化性能（除非重构自然带来）
- 不重构 `codegen/` 模块（后续单独处理）

## 决策

### 决策 1：使用 Zustand 进行状态管理

**理由**：
- 项目已安装 Zustand（`src/shared/stores/settings-store.ts` 在使用）
- 轻量级，适合 Chrome 扩展
- 学习曲线低，团队熟悉
- 支持中间件（持久化、日志等）

**状态结构设计**：

```typescript
// src/editor/store/editor-store.ts
interface EditorState {
  // 图形数据
  arrows: ArrowShape[];
  rects: RectShape[];
  texts: TextShape[];
  mosaics: MosaicShape[];

  // 选择状态
  selectedArrowIds: string[];
  selectedRectIds: string[];
  selectedTextIds: string[];
  selectedMosaicIds: string[];

  // 工具状态
  activeTool: ToolId;

  // 视图状态
  scale: number;
  offset: { x: number; y: number };

  // Actions
  addArrow: (arrow: ArrowShape) => void;
  updateArrow: (id: string, updates: Partial<ArrowShape>) => void;
  deleteArrow: (id: string) => void;
  // ... 其他 actions
}
```

**考虑的替代方案**：
- Context + useReducer：代码量更大，性能需要额外优化
- Jotai：更轻量，但团队不熟悉
- Redux：过于重量级

### 决策 2：Canvas 渲染服务化

**理由**：
- Canvas 绘图函数与 React 组件无关，适合独立服务
- 便于测试和复用
- 清晰的职责边界

**服务接口设计**：

```typescript
// src/editor/services/canvas-renderer.ts
export class CanvasRenderer {
  constructor(private ctx: CanvasRenderingContext2D) {}

  drawArrow(arrow: ArrowShape, isSelected: boolean): void;
  drawRect(rect: RectShape, isSelected: boolean): void;
  drawText(text: TextShape, isSelected: boolean): void;
  drawMosaic(mosaic: MosaicShape, isSelected: boolean): void;
  drawCropBox(crop: CropArea, imageWidth: number, imageHeight: number): void;
  clear(): void;
}
```

### 决策 3：自定义 Hooks 封装业务逻辑

**理由**：
- 遵循 React 最佳实践
- 便于测试和复用
- 组件只关注 UI 渲染

**Hooks 设计**：

```typescript
// src/editor/hooks/useShapeHandlers.ts
export function useShapeHandlers() {
  const { arrows, rects, texts, mosaics, addArrow, updateArrow, ... } = useEditorStore();

  const handleMouseDown = useCallback((e: MouseEvent) => { ... }, []);
  const handleMouseMove = useCallback((e: MouseEvent) => { ... }, []);
  const handleMouseUp = useCallback((e: MouseEvent) => { ... }, []);

  return { handleMouseDown, handleMouseMove, handleMouseUp };
}

// src/editor/hooks/useZoomPan.ts
export function useZoomPan() {
  const { scale, offset, setScale, setOffset } = useEditorStore();

  const zoomIn = useCallback(() => { ... }, []);
  const zoomOut = useCallback(() => { ... }, []);
  const resetZoom = useCallback(() => { ... }, []);

  return { scale, offset, zoomIn, zoomOut, resetZoom };
}
```

### 决策 4：分阶段实施

**理由**：
- 降低风险
- 每阶段可独立验证
- 便于回滚

## 风险 / 权衡

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 功能回归 | 中 | 高 | 每阶段运行完整测试，E2E 测试覆盖核心流程 |
| 状态迁移出错 | 中 | 高 | 渐进迁移，保持 API 兼容 |
| 性能下降 | 低 | 中 | 使用 memo、useMemo、useCallback 优化 |
| 重构周期过长 | 中 | 中 | 优先拆分高频修改的组件 |

## 迁移计划

### 阶段 1：基础拆分（低风险）

1. 提取常量到 `constants.ts`
2. 提取类型到 `types.ts`
3. 拆分子组件到 `components/` 目录

**验证**：编译通过，功能不变

### 阶段 2：状态管理迁移（中风险）

1. 创建 Zustand Store
2. 逐步迁移 useState 到 Store
3. 保持组件接口不变

**验证**：功能测试通过，状态持久化正常

### 阶段 3：服务层封装（中风险）

1. 创建 Canvas 渲染服务
2. 创建图形工厂服务
3. 创建导出服务

**验证**：渲染结果一致，导出功能正常

### 阶段 4：Hooks 抽取（低风险）

1. 抽取 useZoomPan
2. 抽取 useShapeHandlers
3. 抽取 useExport

**验证**：功能测试通过

### 阶段 5：主文件精简（低风险）

1. 清理 App.tsx
2. 整理导入
3. 添加注释

**验证**：App.tsx < 200 行

## 待决问题

1. **是否需要拆分 `codegen/App.tsx`？**
   - 建议：本次重构仅处理 `editor/`，`codegen/` 后续单独处理

2. **是否需要添加单元测试？**
   - 建议：阶段 2 完成后添加核心 Hooks 和服务的测试

3. **是否需要更新文档？**
   - 建议：阶段 5 完成后更新 README 和代码地图
