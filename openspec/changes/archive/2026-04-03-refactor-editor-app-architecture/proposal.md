# 变更：重构 Editor 主组件架构

## 为什么

Editor 主组件（`App.tsx`）当前有 2152 行代码，承担过多职责，存在以下问题：

1. **安全风险**：Chrome Storage 数据读取缺乏运行时类型验证
2. **性能问题**：useEffect 依赖数组过大导致频繁重渲染
3. **维护困难**：事件处理函数超 800 行，圈复杂度过高
4. **代码重复**：图形拖拽逻辑在多处重复实现

## 变更内容

### 1. 数据安全验证
- 添加 Chrome Storage 数据运行时类型验证
- 验证 base64 图片格式有效性

### 2. 组件拆分（**重大变更**）
将巨型组件拆分为多个独立模块：

```
src/editor/
├── App.tsx                    # 主容器（目标 < 300 行）
├── hooks/
│   ├── useShapeDrawing.ts     # 图形绘制逻辑
│   ├── useShapeDragging.ts    # 图形拖拽逻辑
│   ├── useCrop.ts             # 裁剪逻辑
│   ├── useTextEditing.ts      # 文字编辑逻辑
│   ├── useKeyboardShortcuts.ts # 键盘快捷键
│   ├── useMarqueeSelection.ts # 框选逻辑
│   ├── useImageLoading.ts     # 图片加载逻辑
│   └── useSyncedRef.ts        # Ref 同步工具
├── utils/
│   └── drag-resize.ts         # 通用拖拽调整函数
└── constants/
    └── editor-constants.ts    # 魔术数字常量
```

### 3. 性能优化
- 使用 `useRef` 存储事件回调，减少依赖项
- 使用 `structuredClone` 替代 `JSON.parse(JSON.stringify())`
- 提取 `useSyncedRef` Hook 减少 Ref 同步样板代码

### 4. 代码质量改进
- 提取通用 `applyDragResize` 函数消除重复
- 提取魔术数字为命名常量
- 拆分 JSX 中的 IIFE 为独立组件

## 影响

- **受影响规范**：`specs/editor/spec.md`
- **受影响代码**：
  - `src/editor/App.tsx` - 主要重构目标
  - `src/editor/hooks/` - 新增多个自定义 Hook
  - `src/editor/utils/` - 新增通用工具函数
  - `src/editor/constants.ts` - 新增常量定义

## 风险评估

| 风险 | 级别 | 缓解措施 |
|------|------|----------|
| 功能回归 | 中 | 保持现有测试覆盖，逐步迁移 |
| 性能回归 | 低 | 每个 Hook 独立测试性能影响 |
| API 兼容性 | 低 | 保持外部接口不变 |

## 成功标准

- [ ] 主文件行数 < 500 行
- [ ] 所有现有测试通过
- [ ] 无新增 ESLint 警告
- [ ] 圈复杂度 ≤ 5（每个函数）
