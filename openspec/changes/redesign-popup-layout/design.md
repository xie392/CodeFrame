## 上下文

`ui.pen` 设计稿定义了一套全新的玻璃拟态暗色主题，与之前 `update-ui-terminal-style` 变更提出的 Terminal Minimal 风格完全不同。本次变更以设计稿为权威来源，重新实现 Popup 页面。

当前代码已集成 shadcn/ui（`add-shadcn-ui` 已完成），但 CSS 变量使用的是 shadcn 默认的蓝/紫配色，需要全面替换为设计稿定义的颜色体系。

## 目标 / 非目标

- 目标：
  - Popup 页面视觉与 `ui.pen` 设计稿完全一致
  - 保留 shadcn/ui 的组件基础设施（方便后续扩展）
  - 建立新的设计变量体系（颜色、字体、间距）
- 非目标：
  - 不实现功能逻辑（截图、编辑等业务逻辑保持 console.log 占位）
  - 不修改 Editor、CodeGen 等其他页面
  - 不实现亮色主题（设计稿仅定义暗色主题）

## 决策

### 决策 1：设计系统优先级
- **选择**：以 `ui.pen` 设计稿为准，取代 `update-ui-terminal-style` 的 Terminal Minimal 方案
- **原因**：设计稿是视觉权威来源，且当前代码已更接近玻璃拟态风格而非终端风格
- **替代方案**：保留 Terminal Minimal → 与设计稿冲突，不可行

### 决策 2：CSS 变量策略
- **选择**：在现有 shadcn/ui CSS 变量体系上修改值，保持 HSL 格式
- **原因**：shadcn/ui 组件依赖这些变量（如 `bg-background`、`text-primary`），直接修改变量值可最小化组件代码变更
- **替代方案**：抛弃 shadcn/ui 变量体系，全部使用自定义类 → 改动量大，且失去 shadcn/ui 组件兼容性

### 决策 3：字体方案
- **选择**：使用 Oswald（标题/Logo）+ JetBrains Mono（正文/标签）
- **原因**：与设计稿完全一致
- **替代方案**：继续使用 Space Grotesk + DM Sans → 与设计稿不符

### 决策 4：ActionRow 按钮数量
- **选择**：4 个操作按钮（可视截图、选择区域、整页截图、代码编辑器）
- **原因**：与设计稿一致；将"代码编辑器"从 FeatureList 提升到 ActionRow
- **替代方案**：保持 3 个按钮 + FeatureList 中的代码编辑器 → 与设计稿不一致

## 风险 / 权衡

- `update-ui-terminal-style` 变更冲突 → 该变更 0/15 任务未完成，可在本次变更中一并处理或后续关闭
- 设计稿中仅定义暗色主题 → 亮色主题暂不处理，后续单独规划
- Oswald 字体需要从 Google Fonts 加载 → 增加一个字体依赖，但 Oswald 是常用字体，CDN 可用

## 待决问题

- `update-ui-terminal-style` 变更如何处理？（建议关闭或归档，因为设计方向已变更）
