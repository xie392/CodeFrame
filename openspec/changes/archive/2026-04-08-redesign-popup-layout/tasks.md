## 1. 设计变量更新

- [x] 1.1 更新 `globals.css` CSS 变量 — 暗色主题颜色替换为设计稿定义值
- [x] 1.2 更新字体变量 — heading 改为 Oswald，body 改为 JetBrains Mono
- [x] 1.3 更新圆角变量 — `--radius` 改为 1rem
- [x] 1.4 在 `index.html` 中添加 Oswald + JetBrains Mono 字体引入（Google Fonts）

## 2. Popup 页面重构

- [x] 2.1 更新 Popup 容器样式 — 渐变背景、圆角 16px、尺寸 363px
- [x] 2.2 重写 Header 组件 — CF Logo 方块 + Oswald 标题 + 操作按钮（#2D2D2D 背景，8px 圆角）
- [x] 2.3 移除 Tab 导航组件
- [x] 2.4 实现 ActionRow 组件 — 4 个玻璃拟态操作按钮（78×96px，渐变背景 + 背景模糊 + 阴影）
- [x] 2.5 实现 FeatureList 组件 — 玻璃拟态容器 + 4 个功能列表项（48px，12px 圆角）
- [x] 2.6 更新 Footer 组件 — 快捷键提示文字和样式

## 3. 交互效果

- [x] 3.1 添加 ActionRow 按钮悬停效果
- [x] 3.2 添加 FeatureList 列表项悬停效果

## 4. 代码质量

- [x] 4.1 添加 aria-label 无障碍标签
- [x] 4.2 使用 CSS 变量替代硬编码颜色值
- [x] 4.3 使用 Tailwind 工具类替代内联 font-family 样式

## 5. 验证

- [x] 5.1 TypeScript 编译通过
- [x] 5.2 Vite 构建成功
- [ ] 5.3 视觉对比：与 `ui.pen` 设计稿 Popup 页面逐项对比（需人工确认）
