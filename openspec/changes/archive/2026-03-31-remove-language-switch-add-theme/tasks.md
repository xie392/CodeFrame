## 1. 移除语言选择器 UI

- [x] 1.1 删除 `src/codegen/App.tsx` 中 Language Selector 区块（第 128~148 行）
- [x] 1.2 移除未使用的 `ChevronDown` 图标导入（如不再被其他地方引用）

## 2. 定义代码展示区域主题配置

- [x] 2.1 扩展 THEMES 数组，每个主题增加 `shikiTheme`（Shiki 主题名）、`windowBg`（窗口背景色）、`headerBg`（标题栏背景色）字段
  - `vs-dark` → shiki: `dark-plus`, 窗口: `#1E1E1E`, 标题栏: `#252526`
  - `one-dark` → shiki: `one-dark-pro`, 窗口: `#282C34`, 标题栏: `#21252B`
  - `solarized` → shiki: `solarized-dark`, 窗口: `#002B36`, 标题栏: `#073642`
  - `light` → shiki: `github-light`, 窗口: `#FFFFFF`, 标题栏: `#F0F0F0`

## 3. 实现 Shiki 多主题支持

- [x] 3.1 在 `getHighlighter()` 中预加载 4 个 Shiki 主题：`dark-plus`、`one-dark-pro`、`solarized-dark`、`github-light`
- [x] 3.2 将 `useEffect` 高亮依赖从 `[code]` 改为 `[code, selectedTheme]`
- [x] 3.3 在 `codeToHtml` 调用中使用当前主题的 `shikiTheme` 字段替代硬编码的 `dark-plus`

## 4. 代码窗口样式响应主题切换

- [x] 4.1 CodeWindow 的 `backgroundColor` 从当前主题的 `windowBg` 读取（替代硬编码 `#1E1E1E`）
- [x] 4.2 WindowHeader 的 `backgroundColor` 从当前主题的 `headerBg` 读取（替代硬编码 `#252526`）
- [x] 4.3 针对浅色主题（light），调整标题栏圆点颜色和窗口阴影使其在浅色背景下协调

## 5. 验证

- [x] 5.1 依次切换 4 个主题色块，确认右侧代码窗口（背景色、标题栏色、代码高亮配色）整体随之变化
- [x] 5.2 确认编辑器输入代码后预览仍然实时同步
- [x] 5.3 构建通过（`pnpm build`）
