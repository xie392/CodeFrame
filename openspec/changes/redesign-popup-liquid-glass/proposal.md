# 变更：将 Popup 页面重新设计为液态玻璃风格

## 为什么

当前 Popup 页面使用 Terminal Minimal 暗色终端风格（纯暗色模式），视觉表现力有限。为了提升用户体验和视觉质感，需要将 Popup 页面重新设计为液态玻璃（Liquid Glass）风格，同时支持明暗双主题切换，为后续其他页面（Editor、CodeGen、Options）的设计升级奠定基础。

## 变更内容

- 将 Popup 页面设计风格从 Terminal Minimal 更新为 Liquid Glass
- 新增明暗双主题系统（Light / Dark），默认暗色主题，支持用户切换
- 重新定义颜色系统：使用毛玻璃半透明色 + HSL CSS Variables
- 重新定义视觉效果：backdrop-filter blur、半透明背景、柔和边框、平滑过渡
- 重新定义字体系统：保留 Space Grotesk + DM Sans 组合
- 重写 Popup 页面组件（`src/popup/App.tsx`）应用新设计
- 更新全局样式（`src/styles/globals.css`）和 Tailwind 配置

## 影响

- 受影响规范：popup/spec.md（修改）、ui/spec.md（修改）
- 受影响代码：
  - `src/popup/App.tsx`（重写）
  - `src/styles/globals.css`（更新主题变量）
  - `tailwind.config.js`（可能扩展动画/效果）
- 兼容性：与已集成的 shadcn/ui 组件库完全兼容，复用其 CSS Variables 体系
