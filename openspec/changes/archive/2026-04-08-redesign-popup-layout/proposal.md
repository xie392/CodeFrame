# 变更：根据设计稿重新设计 Popup 页面

## 为什么

当前 Popup 页面实现与 `ui.pen` 设计稿存在较大差异：

1. **布局结构不匹配** - 当前代码使用 Tab 导航 + 3+2 网格按钮，设计稿为 4 列操作按钮 + 4 行功能列表
2. **设计系统不一致** - 当前代码使用 shadcn/ui 的 HSL 变量系统，设计稿定义了全新的玻璃拟态暗色主题
3. **颜色体系偏离** - 设计稿使用双色调强调色（#FF6B35 橙色 + #00D4AA 青色），当前代码使用蓝色系 primary
4. **字体系统未对齐** - 设计稿使用 Oswald（标题）+ JetBrains Mono（正文），当前代码使用 Space Grotesk + DM Sans
5. **缺少玻璃拟态效果** - 设计稿定义了详细的渐变背景、背景模糊、阴影效果，当前代码仅有基础的 glass 类

同时，`update-ui-terminal-style` 变更（0/15 任务完成）提出的 Terminal Minimal 风格与设计稿方向完全不同，需要以设计稿为准重新定义。

## 变更内容

### Popup 布局重构
- 整体尺寸：363px × 461px（圆角 16px）
- 背景渐变：#252535 → #1A1A2E → #0F0F1A（180度线性渐变）

### Header 区域（47px）
- Logo：#FF6B35 橙色圆角方块（8px）内显示 "CF"（Oswald 13px bold，#0D0D0D）
- 应用名："CodeFrame"（Oswald 16px semibold，#FFFFFF）
- 右侧操作：主题切换（sun 图标）、设置按钮（settings 图标），背景 #2D2D2D，圆角 8px

### ActionRow 区域（4 列操作按钮）
- 4 个按钮横向排列：可视截图、选择区域、整页截图、代码编辑器
- 按钮尺寸：78×96px，圆角 16px
- 玻璃拟态效果：半透明渐变背景 + 16px 背景模糊 + 阴影
- 图标颜色交替：#FF6B35（橙）和 #00D4AA（青）
- 文字：JetBrains Mono 12px，#FFFFFF

### FeatureList 区域（4 行功能列表）
- 玻璃拟态容器：圆角 16px，20px 背景模糊
- 4 个列表项：延时截取可视区域、全屏截图、编辑本地或粘贴图片、代码编辑器
- 列表项高度 48px，圆角 12px，背景 #FFFFFF08
- 左侧图标 + 文字（JetBrains Mono 13px），右侧 chevron-right 箭头

### Footer 区域（35px）
- 居中文字："// alt+shift+s capture . alt+shift+c code"
- JetBrains Mono 9px，#3D3D3D

## 影响

- 受影响规范：popup/spec.md（修改）、ui/spec.md（修改）
- 受影响代码：`src/popup/App.tsx`、`src/styles/globals.css`、`src/popup/index.html`
- 取代 `update-ui-terminal-style` 变更中关于 Popup 的部分
