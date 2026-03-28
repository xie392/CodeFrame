# 变更：集成 shadcn/ui 组件库

## 为什么

CodeFrame 当前使用手写的 CSS 组件类（`.card`、`.btn`、`.input`）来构建 UI。随着功能迭代（截图操作、代码美化、图片编辑），这些基础组件需要不断重复实现。引入 shadcn/ui 可以：

1. 提供高质量、可定制的 UI 基础组件（Button、Dialog、Select、Tabs 等）
2. 与现有 TailwindCSS + CSS Variables 技术栈无缝集成
3. 组件代码直接拷贝到项目中，完全可控，无运行时外部依赖
4. 后续 UI 开发优先使用 shadcn/ui 组件，减少重复代码

## 变更内容

- 安装并配置 shadcn/ui 初始化环境
- 配置 `components.json`，适配多入口 Vite 构建和 Chrome 扩展 CSP 限制
- 添加 shadcn/ui 所需依赖：`tailwind-merge`、`clsx`、`class-variance-authority`
- 配置 Tailwind CSS 主题以兼容 shadcn/ui 的 CSS Variables 主题系统
- 创建 `src/shared/components/ui/` 目录作为 shadcn/ui 组件存放位置
- 创建 `src/shared/lib/utils.ts` 工具函数（cn 函数）
- 初始化引入基础组件：Button、Tabs、Tooltip
- 将现有手写组件类（`.card`、`.btn`、`.input`）迁移到 shadcn/ui 组件

## 影响

- 受影响规范：ui/spec.md（修改）
- 受影响代码：
  - `package.json`（新增依赖）
  - `tailwind.config.js`（扩展主题变量）
  - `src/styles/globals.css`（整合 shadcn/ui CSS Variables）
  - `src/shared/components/ui/`（新建目录，存放组件）
  - `src/shared/lib/utils.ts`（新建，cn 工具函数）
  - `src/popup/App.tsx`（迁移到手写组件）
- Chrome 扩展 CSP 兼容性：shadcn/ui 的 Radix UI 底层不使用 eval，与 Manifest V3 CSP 兼容
