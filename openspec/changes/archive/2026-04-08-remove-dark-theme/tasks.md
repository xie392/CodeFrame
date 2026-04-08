## 1. 移除暗色主题 CSS

- [x] 1.1 `globals.css` — 删除 `.dark { ... }` 整个变量块
- [x] 1.2 `globals.css` — 删除所有 `.dark .xxx` 选择器覆盖（popup-container、action-btn、feature-list）
- [x] 1.3 `globals.css` — 删除 `html.theme-transitioning` 过渡动画块
- [x] 1.4 `globals.css` — 将 `:root` 中的亮色变量作为唯一值保留

## 2. 移除主题切换代码

- [x] 2.1 `App.tsx` — 移除 `import { useTheme }` 和 `const { toggleTheme } = useTheme()`
- [x] 2.2 `App.tsx` — 移除 Header 中的主题切换按钮（Sun 图标按钮）
- [x] 2.3 `App.tsx` — 保留 Settings 按钮，更新为单独布局（无需 gap 容器）

## 3. 清理配置

- [x] 3.1 `tailwind.config.js` — 移除 `darkMode: "class"`
- [x] 3.2 `index.html` — 移除 `<html>` 上的 `class="dark"`
- [x] 3.3 删除 `src/shared/hooks/use-theme.ts` 文件

## 4. 验证

- [x] 4.1 `pnpm build` 构建成功（tsc + vite build 零错误）
- [ ] 4.2 视觉确认：Popup 仅显示亮色主题，无暗色残留（需人工确认）
