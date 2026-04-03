## 上下文

`src/codegen/App.tsx` 是 CodeFrame 代码截图工具的核心组件，负责：
- 代码编辑（CodeMirror）
- 主题/背景配置
- 窗口样式控制（圆角、阴影、边距）
- 字体和行号配置
- 水印功能
- 图片导出（PNG/JPG/WEBP）
- 剪贴板复制
- 操作历史保存/恢复

当前实现存在严重的架构问题，需要进行模块化重构。

**约束条件**：
- 所有功能必须保持不变
- 必须支持现有的操作历史恢复
- 必须保持与 settings-store 的集成

## 目标 / 非目标

### 目标
- 将 App.tsx 从 1310 行减少到 ~100 行
- 提高代码可测试性（单元测试覆盖率 ≥ 80%）
- 修复 Ref 同步反模式
- 修复潜在的内存泄漏问题
- 提高渲染性能

### 非目标
- 不改变现有功能和用户交互
- 不修改 UI 设计
- 不添加新功能

## 决策

### 决策 1：组件拆分策略

**决策**：按职责拆分为 4 个主要组件

```
src/codegen/
├── App.tsx                    # 主组件（~100 行）
├── components/
│   ├── LeftPanel.tsx          # 左侧控制面板
│   ├── CanvasArea.tsx         # 画布区域
│   ├── CodeWindow.tsx         # 代码窗口
│   ├── ZoomControls.tsx       # 缩放控制
│   ├── PaddingInput.tsx       # 已存在
│   ├── SectionLabel.tsx       # 已存在
│   └── SliderControl.tsx      # 已存在
├── hooks/
│   ├── useCanvasTransform.ts  # 画布缩放/平移
│   ├── useCodeEditor.ts       # 代码编辑器状态
│   ├── useExport.ts           # 导出功能
│   ├── useOperationHistory.ts # 操作历史
│   └── useWindowState.ts      # 窗口状态
├── stores/
│   └── codegen-store.ts       # Zustand 状态管理
└── utils/
    └── layout.ts              # 工具函数
```

**理由**：
- 每个 UI 组件单一职责
- Hooks 封装可复用逻辑
- Store 集中管理状态
- Utils 提供纯函数

**替代方案**：
- ❌ 使用 Context 替代 Zustand：Context 在深层嵌套时性能较差
- ❌ 保持单文件：无法解决可维护性问题

### 决策 2：Ref 同步优化

**决策**：使用 `useCurrent` 自定义 hook 替代 8 个 useEffect

```typescript
// 当前反模式（8 个 useEffect）
useEffect(() => { scaleRef.current = scale; }, [scale]);

// 优化后
function useCurrent<T>(value: T): { current: T } {
  const ref = useRef(value);
  ref.current = value; // 渲染期间同步更新
  return ref;
}

const scaleRef = useCurrent(scale);
```

**理由**：
- 消除 8 个 useEffect 的额外渲染周期
- 代码更简洁
- 符合 React 最佳实践

### 决策 3：状态管理

**决策**：使用 Zustand 聚合状态

```typescript
interface CodegenState {
  theme: ThemeState;      // 主题相关
  window: WindowState;    // 窗口配置
  editor: EditorState;    // 编辑器配置
  watermark: WatermarkState; // 水印配置
  
  setTheme: (theme: Partial<ThemeState>) => void;
  setWindow: (window: Partial<WindowState>) => void;
  setEditor: (editor: Partial<EditorState>) => void;
  setWatermark: (watermark: Partial<WatermarkState>) => void;
}
```

**理由**：
- 状态分组更清晰
- 便于调试（Redux DevTools）
- 与现有 settings-store 模式一致

### 决策 4：内存泄漏修复

**决策**：使用 AbortController 模式管理异步操作

```typescript
const handleExportImage = useCallback(async () => {
  const abortController = new AbortController();
  
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, 50);
      abortController.signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('Cancelled'));
      });
    });
    // ... 导出逻辑
  } finally {
    setIsExporting(false);
  }
}, []);

// 组件卸载时取消
useEffect(() => {
  return () => abortController.abort();
}, []);
```

**理由**：
- 正确处理组件卸载场景
- 防止内存泄漏
- 符合现代异步模式

## 风险 / 权衡

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 重构引入回归问题 | 高 | 每阶段完成后运行 E2E 测试 |
| 状态迁移导致数据丢失 | 中 | 保持 localStorage key 兼容 |
| 团队学习曲线 | 低 | Zustand 与现有模式相似 |
| 重构时间较长 | 中 | 分阶段实施，每阶段独立交付 |

## 迁移计划

### 阶段 1：组件拆分（1-2 天）
1. 创建 `components/` 目录结构
2. 提取 LeftPanel 组件
3. 提取 CanvasArea 组件
4. 提取 CodeWindow 组件
5. 提取 ZoomControls 组件
6. 运行测试验证

### 阶段 2：Hooks 抽取（1 天）
1. 创建 `hooks/` 目录结构
2. 实现 useCanvasTransform
3. 实现 useExport
4. 实现 useWindowState
5. 实现 useCurrent
6. 运行测试验证

### 阶段 3：状态聚合（1 天）
1. 创建 Zustand store
2. 迁移主题状态
3. 迁移窗口状态
4. 迁移编辑器状态
5. 迁移水印状态
6. 更新组件使用 store
7. 运行测试验证

### 阶段 4：代码优化（0.5 天）
1. 提取常量到 constants.ts
2. 提取内联样式
3. 添加输入验证
4. 修复依赖数组
5. 最终测试

### 回滚计划
- 每个 PR 独立可回滚
- 保留原 App.tsx 作为 `App.legacy.tsx` 直至稳定

## 待决问题

- [ ] 是否需要为每个组件编写单元测试？（建议：是）
- [ ] 是否需要添加 Storybook？（建议：暂不添加）
- [ ] 迁移期间是否需要 feature flag？（建议：不需要，直接替换）
