# 变更：统一 CodeGen 与 Editor 的 UI 样式风格

## 为什么

当前 CodeGen 和 Editor 两个页面的 UI 组件样式存在明显差异，包括操作栏背景、输入框样式、颜色选择器形状、滑块样式等，导致用户体验不一致，视觉风格割裂。同时，这些组件分散在各个页面文件中，存在大量重复代码，不符合 DRY 原则。

## 变更内容

### 1. 创建共享 UI 组件库
在 `src/shared/components/ui/` 目录下创建以下通用组件：

| 组件文件 | 说明 |
|----------|------|
| `input.tsx` | 输入框组件，支持标准/小型两种尺寸 |
| `select.tsx` | 下拉选择器组件，支持标准/小型两种尺寸 |
| `slider.tsx` | 滑块组件，带数值显示 |
| `switch.tsx` | 开关组件 |
| `color-picker.tsx` | 颜色选择器组件，圆形色块样式 |

### 2. CodeGen 左侧操作栏背景改为白色
- 将半透明毛玻璃渐变背景改为纯白色背景（#FFFFFF）
- 保持原有的布局和间距不变

### 3. 重构 CodeGen 页面
- 引入共享 UI 组件替代内联组件
- 应用统一样式

### 4. 重构 Editor 页面
- 引入共享 UI 组件替代内联组件
- 应用统一样式

## 影响

- 受影响规范：`codegen`、`editor`、`ui`
- 受影响代码：
  - `src/shared/components/ui/` - 新增 input.tsx、select.tsx、slider.tsx、switch.tsx、color-picker.tsx
  - `src/codegen/App.tsx` - 引入共享组件，修改左侧面板背景
  - `src/editor/App.tsx` - 引入共享组件
  - `src/styles/globals.css` - 新增 CSS 变量
