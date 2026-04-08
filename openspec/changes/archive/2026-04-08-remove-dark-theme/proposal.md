# 变更：移除暗色主题，仅保留亮色主题

## 为什么

当前实现维护了亮色/暗色双主题，但带来以下问题：
1. 暗色主题配色尚未完善，存在黑色残留 bug
2. 设计稿（ui.pen）仅定义暗色主题视觉，亮色主题无权威设计参考
3. 维护双主题增加 CSS 复杂度（`:root` + `.dark` 双套变量 + `.dark .xxx` 覆盖）
4. 主题切换功能当前仅为占位，无实际业务需求

移除暗色主题后，CSS 变量体系从双套简化为单套，所有颜色值直接使用固定值，无需 `darkMode: "class"` 切换机制。

## 变更内容

- **移除** Tailwind `darkMode: "class"` 配置
- **移除** `.dark` CSS 变量块及所有 `.dark .xxx` 选择器覆盖
- **移除** `<html class="dark">` 硬编码
- **移除** `useTheme` hook 及 Header 中的主题切换按钮
- **移除** 主题过渡动画（`html.theme-transitioning`）
- **简化** CSS 变量：亮色值直接作为唯一值，无需 `:root` / `.dark` 分支

## 影响

- 受影响规范：ui/spec.md（修改）、popup/spec.md（修改）
- 受影响代码：
  - `src/styles/globals.css` — 移除 `.dark` 块和暗色覆盖
  - `src/popup/App.tsx` — 移除主题切换按钮和 `useTheme` 引用
  - `src/popup/index.html` — 移除 `class="dark"`
  - `tailwind.config.js` — 移除 `darkMode: "class"`
  - `src/shared/hooks/use-theme.ts` — 删除整个文件
- 依赖关系：需在 `redesign-popup-layout` 归档后执行，或合并处理
