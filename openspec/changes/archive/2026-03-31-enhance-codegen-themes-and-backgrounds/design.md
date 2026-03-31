## 上下文

CodeFrame CodeGen 当前使用单一 `App.tsx` 文件（886 行）承载所有代码美化逻辑。现有主题系统包含 4 个硬编码主题和 5 个纯色背景，配置结构简单（每个主题仅 `windowBg`、`headerBg`、`textColor` 三个颜色属性）。背景色仅支持纯色填充。

本变更需要大幅扩展主题和背景选项，同时保持与现有画布交互模式（缩放/平移/编辑）的兼容性。技术方案参考了 chalk.ist 的设计（MIT 许可），但需要适配 CodeFrame 的 Chrome 扩展场景和现有 CodeMirror 编辑器架构。

## 目标 / 非目标

### 目标
- 将代码主题从 4 种扩展到 12+ 种，覆盖主流开发者的审美偏好
- 将背景选项从 5 种纯色扩展到 15+ 种，包含渐变、纯色和纹理
- 提供窗口视觉微调能力（圆角、阴影、透明度）
- 扩展字体选项和字号调节
- 保持现有功能（画布交互、代码编辑、导出）完全兼容

### 非目标
- 不实现多代码块布局（后续独立提案）
- 不实现 Markdown 块 / Note 块
- 不实现 Twitter Badge 社交徽章
- 不实现 Canvas 粒子效果
- 不实现预设系统（后续独立提案）
- 不从 CodeMirror 迁移回 Shiki（保持当前统一编辑/预览模式）

## 决策

### 1. 主题扩展策略

**决策**：保持 CodeMirror 编辑器统一模式，新增主题通过 `EditorView.theme()` 自定义覆盖实现语法颜色映射。

**替代方案**：
- A) 迁移回 Shiki 预览模式：会丢失编辑体验，违背最新提交（`3079b60`）的设计决策
- B) 使用 CodeMirror LDR（语言数据注册）加载完整主题包：需要大量 Shiki→CodeMirror 颜色映射工作
- C) **（采用）** 为每个主题定义核心语法颜色（keyword、string、comment、number、function），通过 `@codemirror/language` 的 `tagHighlighter` + `EditorView.theme()` 覆盖默认颜色

**理由**：CodeMirror 6 的 `vscodeDark` 主题已提供良好的暗色基础色，我们只需覆盖关键字、字符串、注释、数字等 Token 的颜色即可实现不同主题风格。这种方式改动最小、效果直观。

### 2. 背景系统架构

**决策**：引入 `BackdropConfig` 类型，支持 `solid`（纯色）、`linear-gradient`（线性渐变）、`conic-gradient`（锥形渐变）、`radial-gradient`（径向渐变）四种类型。

```typescript
type BackdropType = 'solid' | 'linear-gradient' | 'conic-gradient' | 'radial-gradient';

interface BackdropConfig {
  id: string;
  type: BackdropType;
  label: string;
  preview: string; // CSS 缩略图
  css: string;     // 完整 CSS background 值
}
```

**理由**：直接使用 CSS 渐变语法，无需额外依赖。`@zumer/snapdom` 截图时能正确捕获 CSS 渐变背景。

### 3. 配置数据拆分

**决策**：将 `THEMES` 和 `BACKGROUNDS` 从 `App.tsx` 抽取到独立的配置文件 `src/codegen/config/themes.ts` 和 `src/codegen/config/backgrounds.ts`。

**理由**：`App.tsx` 已有 886 行，新增大量配置数据会使文件过于臃肿。独立配置文件便于维护和后续扩展。

### 4. 字体加载

**决策**：通过 `index.html` 的 `<link>` 标签预加载 Google Fonts，与现有 JetBrains Mono 加载方式一致。

**字体清单**（按优先级）：
1. Fira Code - 最流行的编程字体之一
2. Source Code Pro - Adobe 出品，覆盖广
3. IBM Plex Mono - IBM 开源字体
4. Cascadia Code - 微软出品（需 CDN）

## 风险 / 权衡

| 风险 | 缓解措施 |
|------|----------|
| 字体加载增加页面初始化时间 | 使用 `font-display: swap`，先显示系统等宽字体 |
| 大量渐变背景 CSS 增加代码体积 | 使用 CSS 变量和简写语法，配置文件体积控制在 5KB 以内 |
| CodeMirror 主题覆盖可能不完整 | 优先覆盖最常用的 6 种 Token 类型（keyword/string/comment/number/function/variable），其余使用默认色 |
| 截图时渐变/透明效果可能不一致 | 在导出时确保 CSS 背景被正确渲染，必要时调整 snapdom 配置 |
| 新增控件导致 LeftPanel 空间不足 | 引入可折叠分组（Accordion）或滚动面板 |

## 待决问题

- [ ] 是否需要在 Chrome 扩展的 CSP 限制下考虑字体加载方式（`font-display` vs web_accessible_resources）
- [ ] 背景选择器 UI 使用色块网格还是下拉选择器（考虑到渐变背景不易在小色块中展示）
- [ ] 窗口透明度调节是否需要实时预览（可能影响编辑体验）
