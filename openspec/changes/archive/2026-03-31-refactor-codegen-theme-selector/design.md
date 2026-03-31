## 上下文

CodeGen 使用 CodeMirror 6（通过 `@uiw/react-codemirror`）作为代码编辑器。当前有 12 个"主题"，但实现方式是：
- 所有暗色主题共用 `vscodeDark` 作为 `theme` prop
- 所有亮色主题共用 `vscodeLight` 作为 `theme` prop
- 通过 `EditorView.theme()` 覆盖背景色和 gutter 样式
- 通过 `HighlightStyle.define()` 自定义语法高亮颜色

这导致：主题切换感觉像"换了个壳"，gutter、光标、滚动条等编辑器 UI 元素始终是 VS Code 的样子。

**约束**：
- Manifest V3 CSP 兼容（不能用 Monaco）
- 需保持窗口背景色/标题栏的独立配置能力
- 需保持预览模式下 Shiki 高亮与 CodeMirror 主题的视觉一致性

## 目标 / 非目标

**目标**：
- 每个主题使用对应的 CodeMirror 原生主题包，提供真实的编辑器体验
- 修复 gutter 背景色与编辑器背景色不一致的问题
- 主题选择器改为下拉选择器，显示主题名称，提升可用性
- 保持窗口容器样式（背景色、标题栏、阴影）的独立配置

**非目标**：
- 不支持用户自定义创建主题
- 不修改 Shiki 预览渲染的主题映射（维持现状）
- 不改变代码编辑器的其他功能（括号匹配、自动缩进等）

## 决策

### 决策 1：使用 `@uiw/codemirror-themes` 系列包

**选择**：安装对应的 `@uiw/codemirror-theme-*` 包（如 `@uiw/codemirror-theme-vscode`、`@uiw/codemirror-theme-dracula` 等）

**替代方案**：
1. **手动创建 12 个完整 EditorView.theme()** — 工作量大，维护成本高，且难以覆盖 CodeMirror 所有 UI 元素
2. **使用 codemirror-themes 聚合包** — 部分主题不在聚合包中

**理由**：`@uiw` 是 CodeMirror 主题的事实标准提供者，主题包质量高，通过 `theme` prop 直接传入即可，不需要手动覆盖 gutter/背景等样式。

### 决策 2：移除 EditorView.theme() 中的背景/gutter 覆盖

**选择**：完全依赖库主题包的内置样式，仅保留字体和行高配置

**理由**：库主题已经正确处理了 gutter 背景、前景色、光标、选中态等，手动覆盖是导致样式冲突的根源。字体和行高属于排版配置，与主题无关，保留在自定义覆盖中。

### 决策 3：主题选择器改为 Select 下拉

**选择**：将色块横滚改为 `shadcn/ui` 的 Select 组件

**理由**：
- 12 个色块横向滚动体验差，难以辨认
- 下拉选择器可同时显示主题名称和色块预览
- 与项目已使用的 shadcn/ui 设计系统一致

## 风险 / 权衡

- **新增依赖体积**：每个主题包约 5-15 KB gzip，12 个主题总计约 80-120 KB → 缓解：可通过动态 import 按需加载，或只安装用户实际使用的主题包
- **Shiki 与 CodeMirror 主题视觉差异**：编辑模式下使用 CodeMirror 主题，预览模式下使用 Shiki 主题，两者可能有色差 → 缓解：保持现有 Shiki 主题映射，作为已知限制接受
- **主题包 API 差异**：不同主题包的导出名可能不一致 → 缓解：在 themes.ts 中建立统一的映射层

## 迁移计划

1. 安装所需的 `@uiw/codemirror-theme-*` 包
2. 重构 `ThemeConfig` 接口，移除 `syntax` 字段（改用库自带），新增 `theme` 字段指向 CodeMirror 主题包导出
3. 移除 `App.tsx` 中 `editorBaseTheme` 的背景/gutter 覆盖代码
4. 将色块选择器替换为 Select 组件
5. 手动测试每个主题的视觉效果

## 待决问题

- 是否需要支持用户自定义主题？→ 暂不需要，按 YAGNI 原则排除
- 主题包是否全部安装还是按需加载？→ 建议先全部安装，如果体积成为问题再优化
