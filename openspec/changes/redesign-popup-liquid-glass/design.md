## 上下文

CodeFrame 是一个 Chrome 扩展项目，当前 Popup 页面使用 Terminal Minimal 暗色终端风格，仅支持纯暗色模式。项目已集成 shadcn/ui（HSL CSS Variables 体系），需要在此基础上升级视觉设计。

## 目标 / 非目标

**目标：**
- 将 Popup 页面重新设计为液态玻璃风格
- 支持明暗双主题，默认暗色
- 保持与 shadcn/ui CSS Variables 体系的兼容
- 保留现有功能结构（Header、Tabs、操作按钮、Footer）
- 为后续页面设计升级建立设计模式

**非目标：**
- 不重构功能逻辑（截图操作、消息通信等）
- 不在本变更中重新设计 Editor、CodeGen、Options 页面
- 不引入复杂动画库（Framer Motion/GSAP），使用纯 CSS 实现

## 决策

### 1. 液态玻璃视觉系统

**决策**：采用 Glassmorphism + Liquid Glass 混合方案。

**核心效果：**
- `backdrop-filter: blur(12px) saturate(180%)` — 毛玻璃模糊
- 半透明背景：Dark `rgba(255,255,255,0.08)` / Light `rgba(255,255,255,0.6)`
- 柔和边框：Dark `rgba(255,255,255,0.12)` / Light `rgba(0,0,0,0.08)`
- 平滑过渡：`transition-all duration-300 ease`

**理由**：
- 毛玻璃效果是 Liquid Glass 的核心，实现简单（纯 CSS）
- Chrome 扩展环境支持 `backdrop-filter`（Chrome 88+）
- 不需要额外依赖，性能可控

### 2. 双主题系统

**决策**：使用 TailwindCSS `darkMode: "class"` + shadcn/ui HSL Variables。

- `:root` 定义亮色主题变量
- `.dark` 定义暗色主题变量
- 通过 `<html class="dark">` 切换
- 主题偏好存储于 `chrome.storage.local`

**理由**：
- 项目已配置 `darkMode: "class"`，无缝对接
- shadcn/ui 组件已使用 HSL Variables，自动适配双主题
- CSS Variables 方案性能最优，无需 JS 运行时计算

### 3. 颜色方案

**暗色主题（默认）：**

| 用途 | 变量 | 色值 | 说明 |
|------|------|------|------|
| 背景 | --background | hsl(222 47% 6%) | #0B1120 深海蓝 |
| 前景 | --foreground | hsl(210 40% 96%) | #F1F5F9 |
| 玻璃卡片 | --card | hsl(222 47% 10%) | 半透明 + blur |
| 主色 | --primary | hsl(217 91% 60%) | #3B82F6 蓝色 |
| 次色 | --secondary | hsl(215 30% 18%) | 玻璃灰 |
| 边框 | --border | hsl(215 25% 18%) | 柔和暗边框 |

**亮色主题：**

| 用途 | 变量 | 色值 | 说明 |
|------|------|------|------|
| 背景 | --background | hsl(210 20% 97%) | #F5F7FA 冷灰白 |
| 前景 | --foreground | hsl(222 47% 11%) | #1E293B |
| 玻璃卡片 | --card | hsl(0 0% 100%) | 白色半透明 + blur |
| 主色 | --primary | hsl(217 91% 60%) | #3B82F6 蓝色（保持一致） |
| 次色 | --secondary | hsl(210 20% 93%) | 柔和灰 |
| 边框 | --border | hsl(214 20% 87%) | 柔和浅边框 |

### 4. Popup 布局调整

**决策**：保持 360x500px 尺寸和四区域结构，更新视觉表现。

- Header：玻璃效果背景，Logo 使用 SVG 图标替代文字 CF
- Tabs：使用 shadcn/ui Tabs 组件，玻璃背景胶囊
- 操作按钮：玻璃卡片 + hover 时增加亮度/模糊变化
- Footer：保留快捷键提示，更新为玻璃分割线

### 5. 字体保持不变

**决策**：继续使用 Space Grotesk（标题）+ DM Sans（正文）。

**理由**：
- 已在 shadcn/ui 集成时配置
- 字体组合与液态玻璃风格兼容
- 避免额外的字体加载开销

## 风险 / 权衡

- **backdrop-filter 性能**：多层 blur 可能影响低端设备 → 限制 blur 层级，仅用于卡片/面板
- **主题切换闪烁**：页面加载时可能出现主题闪烁 → 在 `<head>` 中注入内联脚本提前设置 class
- **亮色主题对比度**：毛玻璃效果在亮色下对比度降低 → 确保文字颜色 WCAG 4.5:1 合规

## 待决问题

（已全部解决）
