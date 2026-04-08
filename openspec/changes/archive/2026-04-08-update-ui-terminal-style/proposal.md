# 变更：更新 UI 设计为 Terminal Minimal 风格

## 为什么

当前 UI 设计存在以下问题：
1. **颜色系统不一致** - 使用了 #6366F1 (Indigo) 作为预览区背景，与 Terminal Minimal 风格不匹配
2. **缺少终端风格元素** - 没有使用终端风格的符号（~, >, //）和 snake_case 命名约定
3. **字体系统不统一** - 应该使用 JetBrains Mono 作为唯一字体，通过 weight 变化建立层级
4. **主色调偏差** - 当前使用 #10B981，应该使用 Terminal Minimal 的 #22C55E 绿色

## 变更内容

### 颜色系统更新
- **背景色**
  - Page Background: #0C0C0C (从 #0A0A0A 更新)
  - Surface/Card: #171717
  - Input/Highlight: #1A1A1A
  - Border: #1F1F1F / #252525
- **文字颜色**
  - Primary: #E5E5E5
  - Secondary: #A3A3A3
  - Tertiary: #737373
  - Muted: #525252
- **强调色**
  - Primary: #22C55E (绿色)
  - Warning: #F59E0B
  - Info: #3B82F6
  - Error: #EF4444

### 字体系统
- 统一使用 JetBrains Mono
- 通过 weight (400/500/600) 建立层级
- 所有文字使用 lowercase
- 标签使用 snake_case (如 `capture_area`, `code_generator`)

### 终端风格元素
- Logo 使用 `~` 符号前缀
- 导航使用 `>` 作为活动指示器
- 描述文字使用 `//` 前缀
- 状态使用颜色文字（无背景 chip）

### 圆角系统
- 页面容器、表格: 0px
- 按钮、输入框: 4px
- 图表元素: 2px

## 影响

- 受影响规范：ui/spec.md（修改）
- 受影响文件：codeframe-ui.pen
- 设计风格：Terminal Minimal Dashboard
