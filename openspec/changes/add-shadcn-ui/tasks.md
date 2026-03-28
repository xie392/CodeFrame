## 1. 环境配置

- [x] 1.1 安装 shadcn/ui 所需依赖：`tailwind-merge`、`clsx`、`class-variance-authority`
- [x] 1.2 创建 `components.json` 配置文件，设置组件路径为 `src/shared/components/ui`，样式路径为 `src/styles/globals.css`
- [x] 1.3 创建 `src/shared/lib/utils.ts`，导出 `cn` 工具函数
- [x] 1.4 更新 `tailwind.config.js`，扩展 borderRadius、keyframes，添加组件目录到 content

## 2. 主题整合

- [x] 2.1 更新 `src/styles/globals.css`，添加 shadcn/ui 所需的 HSL CSS Variables（`--background`、`--foreground`、`--primary`、`--secondary`、`--muted`、`--accent`、`--destructive`、`--border`、`--ring`、`--radius`）
- [x] 2.2 将现有 CSS Variables 颜色值映射到 shadcn/ui HSL 变量，保持项目设计风格

## 3. 基础组件引入

- [x] 3.1 添加 shadcn/ui Button 组件到 `src/shared/components/ui/button.tsx`
- [x] 3.2 添加 shadcn/ui Tabs 组件到 `src/shared/components/ui/tabs.tsx`
- [x] 3.3 添加 shadcn/ui Tooltip 组件到 `src/shared/components/ui/tooltip.tsx`

## 4. 验证

- [x] 4.1 确认构建成功（`pnpm build`），无 TypeScript 类型错误
- [x] 4.2 确认 Chrome 扩展 CSP 兼容，无运行时错误
- [x] 4.3 确认所有入口页面正常加载，样式一致
