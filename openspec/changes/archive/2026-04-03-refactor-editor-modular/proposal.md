# 变更：重构 Editor 模块化架构

## 为什么

`src/editor/App.tsx` 当前是一个 **5988 行**的巨型单体文件，严重违反单一职责原则，导致以下问题：

1. **无法维护**：单文件包含常量定义、类型定义、20+ 个子组件、30+ 个 useState、事件处理、导出逻辑等
2. **无法测试**：组件与逻辑紧密耦合，缺少依赖注入，难以进行单元测试
3. **无法扩展**：添加新功能需要在巨大文件中定位和修改，容易引入 bug
4. **团队协作困难**：多人同时修改同一文件容易产生冲突
5. **性能问题**：整个文件作为一个模块，无法进行代码分割和懒加载

## 变更内容

### 核心变更

1. **拆分子组件**：将 20+ 个内嵌子组件拆分为独立文件
2. **统一状态管理**：使用 Zustand 替代 30+ 个分散的 useState
3. **封装 Canvas 服务**：将 Canvas 绑定的绘图函数封装为独立服务
4. **抽取自定义 Hooks**：将业务逻辑抽取为可复用的 Hooks
5. **整理类型和常量**：统一管理类型定义和常量

### 目标架构

```
src/editor/
├── App.tsx                    # 主入口，仅负责组合（目标 < 200 行）
├── index.ts                   # 导出
├── types.ts                   # 所有类型定义
├── constants.ts               # 所有常量
├── hooks/
│   ├── useEditorState.ts      # 状态管理 Hook
│   ├── useEditorHistory.ts    # 历史记录 Hook（已有）
│   ├── useCanvasRenderer.ts   # Canvas 渲染 Hook
│   ├── useShapeHandlers.ts    # 图形操作 Hook
│   ├── useZoomPan.ts          # 缩放平移 Hook
│   └── useExport.ts           # 导出 Hook
├── services/
│   ├── canvas-renderer.ts     # Canvas 渲染服务
│   ├── shape-factory.ts       # 图形工厂
│   └── export-service.ts      # 导出服务
├── components/
│   ├── Toolbar/               # 工具栏组件
│   ├── PropertiesPanel/       # 属性面板组件
│   ├── FrameSettings/         # 帧设置组件
│   ├── CanvasImage/           # Canvas 图片组件
│   ├── ColorPicker/           # 颜色选择器
│   └── ...                    # 其他组件
├── utils/
│   ├── geometry.ts            # 几何计算
│   └── image.ts               # 图片处理
└── store/
    └── editor-store.ts        # Zustand Store
```

## 影响

- **受影响规范**：`specs/editor/spec.md`
- **受影响代码**：`src/editor/` 整个目录
- **重大变更**：
  - 文件结构完全重组
  - 状态管理方式变更（useState → Zustand）
  - 组件导入路径变更

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 重构过程中功能回归 | 分阶段进行，每阶段完成后运行完整测试 |
| 性能下降 | 使用 React.memo 和 useMemo 优化渲染 |
| 状态管理迁移出错 | 保持 API 兼容，逐步迁移 |

## 成功标准

1. `src/editor/App.tsx` 行数 < 200 行
2. 所有子组件独立文件，每个文件 < 300 行
3. 单元测试覆盖率 ≥ 60%
4. 所有现有功能正常工作
5. 无性能退化
