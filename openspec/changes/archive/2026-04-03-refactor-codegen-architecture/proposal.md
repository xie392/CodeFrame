# 变更：重构 CodeGen 模块架构

## 为什么

当前 `src/codegen/App.tsx` 文件达到 1310 行，严重违反单一职责原则。文件包含 20+ 个功能模块、20+ 个 useState 调用、8 个 Ref 同步 useEffect，存在以下问题：

1. **可维护性差**：单文件承载所有功能，团队协作冲突风险高
2. **性能问题**：Ref 同步反模式导致额外渲染周期，内联样式对象导致不必要的重渲染
3. **测试困难**：庞大组件难以进行单元测试
4. **内存泄漏风险**：Promise 中的 setTimeout 无法清理

## 变更内容

### 第一阶段：组件拆分（P0）
- 将 LeftPanel 拆分为独立组件
- 将 CanvasArea 拆分为独立组件
- 将 CodeWindow 拆分为独立组件
- 将 ZoomControls 拆分为独立组件

### 第二阶段：Hooks 抽取（P0）
- 创建 `useCanvasTransform` hook 管理缩放/平移
- 创建 `useExport` hook 管理导出功能
- 创建 `useWindowState` hook 管理窗口状态
- 修复 Ref 同步反模式，使用 `useCurrent` 自定义 hook

### 第三阶段：状态聚合（P1）
- 创建 Zustand store 聚合相关状态
- 将分散的 20+ 个 useState 聚合为 4 个状态分组

### 第四阶段：代码优化（P2）
- 提取常量，消除魔法数字
- 提取内联样式对象
- 添加输入验证
- 修复依赖数组问题

## 影响

- **受影响规范**：`codegen`（所有需求保持不变，仅重构实现）
- **受影响代码**：
  - `src/codegen/App.tsx` → 拆分为多个文件
  - 新增 `src/codegen/components/` 目录
  - 新增 `src/codegen/hooks/` 目录
  - 新增 `src/codegen/stores/` 目录
  - 新增 `src/codegen/utils/` 目录

## 约束

- **功能不变**：所有现有功能和用户交互保持一致
- **渐进式重构**：每个阶段独立可测试，不影响其他阶段
- **向后兼容**：保留现有导出接口

## 风险

- 重构过程中可能引入回归问题 → 每阶段完成后运行完整测试
- 状态迁移可能导致数据丢失 → 保持 localStorage 兼容
