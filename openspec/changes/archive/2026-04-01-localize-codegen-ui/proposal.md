# 提案：localize-codegen-ui

## 概述

将 CodeGen 页面侧边栏中所有英文 UI 文本替换为中文，并移除遗留的 `code_input` 旧标题。

## 动机

当前 CodeGen 页面侧边栏存在大量英文标签和下划线命名风格的文本（如 `theme`、`background`、`border_radius` 等），不符合项目中文界面的设计规范。`code_input` 是旧版代码编辑器的标题，当前已无实际用途，需要清理。

## 变更范围

仅涉及 CodeGen 页面侧边栏的 UI 文本替换，不涉及功能逻辑变更。

**涉及文件：**
- `src/codegen/App.tsx` — 侧边栏标签、按钮文案

**不涉及：**
- 主题名称（如 VS Code Dark+、Dracula 等）— 专有名词保留英文
- 字体名称（如 JetBrains Mono、Fira Code 等）— 专有名词保留英文
- 背景色名称（如 Indigo、Sunset 等）— 色彩专有名词保留英文
- 功能逻辑、状态管理

## 方案

将 App.tsx 中的英文 UI 文本逐个替换为对应中文：

| 当前文本 | 替换为 | 说明 |
|----------|--------|------|
| `code_input` | (删除) | 旧标题，无实际用途 |
| `theme` | `主题` | SectionLabel |
| `background` | `背景` | SectionLabel |
| `padding` | `内边距` | SectionLabel |
| `window` | `窗口` | SectionLabel |
| `title_bar` | `标题栏` | Toggle 标签 |
| `shadow` | `阴影` | Toggle 标签 |
| `border_radius` | `圆角` | SectionLabel |
| `outer` | `外圆角` | Popover 标签 |
| `inner` | `内圆角` | Popover 标签 |
| `line_numbers` | `行号` | Toggle 标签 |
| `font` | `字体` | SectionLabel |
| `watermark` | `水印` | SectionLabel |
| `Watermark text...` | `水印文字...` | Placeholder |
| `exporting...` | `导出中...` | 按钮加载态 |
| `$ export_image` | `$ 导出图片` | 按钮文本 |

## 风险评估

- **风险等级**：极低
- **影响面**：仅 UI 文本显示，不影响功能
- **回滚方案**：简单的文本替换，可快速回滚
