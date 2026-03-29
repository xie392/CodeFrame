## 1. 主题系统搭建

- [x] 1.1 更新 `src/styles/globals.css`：定义 `:root`（亮色）和 `.dark`（暗色）两套 HSL CSS Variables
- [x] 1.2 添加玻璃效果工具类：`.glass` / `.glass-card` / `.glass-divider`
- [x] 1.3 确保与 shadcn/ui 组件的双主题兼容

## 2. Popup 页面重写

- [x] 2.1 重写 Header：玻璃背景、Logo、主题切换按钮 + 设置按钮
- [x] 2.2 重写 Tab 导航：使用 shadcn/ui Tabs 组件，玻璃背景
- [x] 2.3 重写操作按钮：玻璃卡片样式、hover 过渡效果
- [x] 2.4 重写 Footer：玻璃分割线、快捷键提示

## 3. 主题切换逻辑

- [x] 3.1 创建 `useTheme` hook
- [x] 3.2 主题偏好持久化至 `chrome.storage.local`
- [x] 3.3 在 Popup 入口 HTML 中注入内联脚本防止主题闪烁

## 4. 验证

- [x] 4.1 构建成功（`pnpm build`），无 TypeScript 错误
- [x] 4.2 暗色/亮色主题切换正常，视觉符合设计稿
- [x] 4.3 shadcn/ui 组件（Button、Tabs）在双主题下样式正确
- [x] 4.4 Chrome 扩展 CSP 兼容，无运行时错误
