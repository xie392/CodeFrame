## 上下文

CodeFrame 是一个基于 React 18 + TypeScript + TailwindCSS 3.4 + Vite 的 Chrome 扩展项目，采用多入口构建（popup、editor、codegen、options）。当前样式系统基于 CSS Variables + TailwindCSS 自定义配置，使用手写组件类。

## 目标 / 非目标

**目标：**
- 集成 shadcn/ui 作为项目 UI 组件库，后续新组件优先使用
- 保持与现有 Terminal Minimal / Modern Tech 设计风格的一致性
- 确保与 Chrome Extension Manifest V3 CSP 兼容
- 无缝适配多入口 Vite 构建结构

**非目标：**
- 不将现有所有页面完整迁移到 shadcn/ui（仅迁移手写的通用组件类）
- 不引入 shadcn/ui 的完整组件集（仅按需引入）
- 不改变现有的设计风格和色彩系统

## 决策

### 1. 组件存放路径：`src/shared/components/ui/`

**决策**：将 shadcn/ui 组件放在 `src/shared/components/ui/` 下。

**理由**：
- Chrome 扩展有多个入口（popup、editor、codegen、options），需要共享组件
- `src/shared/` 已是项目约定的共享模块目录
- `@shared/components/ui/*` 通过已有路径别名可直接引用

**替代方案**：
- `src/components/ui/`：远离共享目录，不适合多入口结构
- 每个入口放独立副本：代码重复，维护成本高

### 2. 主题整合策略：CSS Variables 合并

**决策**：将 shadcn/ui 的 HSL CSS Variables 与现有 CSS Variables 合并，采用 shadcn/ui 的命名约定（`--background`、`--foreground`、`--primary` 等），保留现有颜色值。

**理由**：
- shadcn/ui 强依赖 HSL CSS Variables 主题系统
- 现有 CSS Variables 需要映射到 shadcn/ui 期望的变量名
- 保留项目设计色彩（暗色系 + 绿色主色调）

**替代方案**：
- 保持两套 CSS Variables：增加维护复杂度
- 完全使用 shadcn/ui 默认主题：丢失项目特色

### 3. Chrome 扩展 CSP 兼容

**决策**：shadcn/ui 基于 Radix UI 原语，不使用 `eval()` 或内联脚本，与 Manifest V3 CSP 兼容。

**理由**：
- shadcn/ui 组件是纯 React 代码，直接打包到扩展中
- Radix UI 使用 DOM API 而非 eval/inline script
- TailwindCSS 在构建时生成纯 CSS，无运行时 eval

### 4. Tailwind 配置扩展

**决策**：在 `tailwind.config.js` 中扩展 shadcn/ui 所需的 `borderRadius` 和 `keyframes`，将组件目录添加到 `content` 扫描路径。

**理由**：
- shadcn/ui 组件使用 `rounded-md`、`rounded-lg` 等需要 Tailwind 支持
- 组件目录必须在 Tailwind content 扫描范围内才能生成对应的 CSS

## 风险 / 权衡

- **构建体积**：shadcn/ui 组件会增加打包体积 → 按需引入，仅添加实际使用的组件
- **主题迁移成本**：CSS Variables 合并需要一次性工作 → 迁移后维护成本降低
- **多入口共享**：需要确保所有入口都能正确引用共享组件 → 已有路径别名支持

## 待决问题

- 是否需要引入 shadcn/ui 的 dark mode 切换支持（项目当前为纯暗色模式）
