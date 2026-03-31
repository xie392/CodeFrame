## 1. 配置数据抽取

- [x] 1.1 创建 `src/codegen/config/themes.ts`，从 `App.tsx` 抽取现有 4 个主题配置
- [x] 1.2 扩展 THEMES 数组，新增 8 个主题（Dracula、Nord、Tokyo Night、GitHub Dark、Catppuccin、Gruvbox、Rose Pine、Kanagawa），每个主题定义完整的语法颜色
- [x] 1.3 创建 `src/codegen/config/backgrounds.ts`，从 `App.tsx` 抽取现有 5 个纯色背景
- [x] 1.4 新增 11 种渐变背景预设（7 线性渐变 + 2 锥形渐变 + 1 径向渐变 + 自定义颜色选择器）
- [x] 1.5 定义 `BackdropConfig` 类型接口（`src/codegen/config/backgrounds.ts` 内）
- [x] 1.6 更新 `App.tsx` 导入路径，移除内联配置（THEMES / BACKGROUNDS 常量）

**依赖**：无
**验证**：TypeScript 零错误，Vite 构建成功
**实施细节**：
- `themes.ts` 导出 `ThemeConfig` 接口、`SyntaxColors` 接口、`createThemeExtension()` 函数、`THEMES` 数组
- `backgrounds.ts` 导出 `BackdropConfig` 接口、`SOLID_BACKGROUNDS`、`GRADIENT_BACKGROUNDS`、`BACKGROUNDS` 数组
- `App.tsx` 从 `./config/themes` 和 `./config/backgrounds` 导入

## 2. 主题选择器 UI 升级

- [x] 2.1 将主题色块从 4 个扩展为 12 个，支持横向滚动（`overflow-x-auto`）
- [x] 2.2 调整色块尺寸为 32×32px（`w-8 h-8`），圆角 6px
- [x] 2.3 为每个主题配置准确的预览色（使用窗口背景色）
- [x] 2.4 确保主题切换时选中指示器（2px #FF6B35 橙色边框）正确显示

**依赖**：1.2
**验证**：12 主题色块正确渲染，点击切换正常，Tooltip 显示主题名

## 3. CodeMirror 语法颜色覆盖

- [x] 3.1 为每个新主题定义语法颜色覆盖（keyword、string、comment、number、function、variable、operator、punctuation、type 共 9 种 Token）
- [x] 3.2 实现主题切换时的 CodeMirror 主题动态更新逻辑（通过 `useMemo` + `syntaxExtension`）
- [x] 3.3 确保暗色/亮色主题切换时基础主题（vscodeDark/vscodeLight）正确切换（`isDark` 字段判断）

**依赖**：1.2
**验证**：切换不同主题时，代码编辑区的语法高亮颜色实时变化
**实施细节**：
- 使用 `@codemirror/language` 的 `HighlightStyle.define` + `syntaxHighlighting` 扩展
- 使用 `@lezer/highlight` 的 `tags`（t.keyword、t.string、t.comment 等）映射语法 Token
- `createThemeExtension(colors)` 返回 `Extension`，放入 `cmExtensions` 的 `useMemo`
- 新增依赖：`@codemirror/language`、`@lezer/highlight`、`@codemirror/state`（直接依赖）

## 4. 背景选择器 UI 升级

- [x] 4.1 重构背景选择器，支持纯色色块 + 渐变预览条混合排列（6 列 grid 布局）
- [x] 4.2 渐变预览直接使用 CSS `background` 属性（`bg.preview`）
- [x] 4.3 实现自定义颜色选择器（原生 `<input type="color">` + `Palette` 图标入口）
- [x] 4.4 渐变背景的 padding 填充区域使用 `background` CSS 属性渲染（支持渐变和纯色）

**依赖**：1.3, 1.4
**验证**：16 背景选项正确显示，渐变背景实时预览，自定义颜色选择器工作正常
**实施细节**：
- 选中状态使用白色圆形 `Check` 图标（纯色背景）或 2px #FF6B35 边框（渐变背景）
- 自定义颜色选择器通过 `<label>` + 隐藏 `<input type="color">` 实现
- `getBackgroundCss()` 函数根据 `selectedBg` 返回 CSS background 值

## 5. 窗口视觉增强

- [x] 5.1 新增窗口圆角滑块控件（0-20px），默认 12px
- [x] 5.2 新增窗口阴影开关 + 强度滑块（0-100%），默认开启 50%
- [x] 5.3 新增窗口标题栏显示/隐藏开关，默认显示
- [x] 5.4 修改 `calcAutoHeight` 函数，新增 `showHeader` 和 `fontSize` 参数

**依赖**：无
**验证**：圆角、阴影、标题栏可见性实时调节正常
**实施细节**：
- `windowShadow` 使用 `useMemo` 计算 alpha 值
- 标题栏隐藏时 `calcAutoHeight` 不计入 `HEADER_HEIGHT`
- `showHeader` 使用 ref（`showHeaderRef`）避免 `bindResize` 闭包陷阱
- 背景 padding 区域的 `borderRadius` 为 `borderRadius + 4px`
- 代码窗口底部 resize handle 的 `borderRadius` 适配

## 6. 字体扩展

- [x] 6.1 在 `index.html` 中新增 Google Fonts 加载（Fira Code、Source Code Pro、IBM Plex Mono）
- [x] 6.2 新增字体下拉选择器 UI（`<select>`），支持 4 种字体选项
- [x] 6.3 实现字体切换时 CodeMirror 编辑器字体的动态更新（通过 `editorBaseTheme` 的 `useMemo`）
- [x] 6.4 新增字号滑块控件（12-24px），默认 13px
- [x] 6.5 字号变化时自动重新计算窗口高度

**依赖**：无
**验证**：4 种字体切换正常，字号调节正常
**实施细节**：
- `FONT_OPTIONS` 常量定义 4 种字体（id、label、family）
- `editorBaseTheme` 的 `useMemo` 依赖 `fontSize` 和 `selectedFontConfig.family`
- 行高 = fontSize + 7px，同步到 `.cm-content` 的 lineHeight

## 7. 水印功能

- [x] 7.1 实现水印渲染组件（居中放置，半透明文字）
- [x] 7.2 新增水印开关 + 文字输入 + 透明度滑块（10-90%）
- [x] 7.3 水印在编辑模式下自动隐藏（`!isEditing` 条件）
- [x] 7.4 水印覆盖在代码编辑区上方（`pointer-events-none select-none`）

**依赖**：无
**验证**：水印开关/调节正常
**未完成**：7.3 导出截图时水印是否包含需实际测试（依赖 `@zumer/snapdom`）

## 8. LeftPanel 布局适配

- [x] 8.1 LeftPanel 设置为 `overflow-y-auto`，支持滚动访问所有控件
- [x] 8.2 新增 3 个可复用子组件：`SectionLabel`、`ToggleSwitch`、`SliderControl`
- [x] 8.3 所有控件在 LeftPanel 240px 宽度内正确显示（font select、slider 等均使用 `w-full`）

**依赖**：全部
**验证**：LeftPanel 所有控件可正常访问和操作

## 9. 截图导出兼容性

- [ ] 9.1 确认渐变背景、阴影、水印在 `@zumer/snapdom` 截图中正确渲染
- [ ] 9.2 确认导出时隐藏水印设置控件（仅显示水印效果）
- [ ] 9.3 测试 PNG/JPG/WEBP 三种格式的导出质量

**依赖**：4.4, 5.2, 7.3
**验证**：导出图片包含所有视觉增强效果
**状态**：尚未测试，需要在实际截图导出流程中验证

---

## 新增依赖

| 包 | 版本 | 用途 |
|---|------|------|
| `@codemirror/language` | 6.12.3 | `HighlightStyle.define` + `syntaxHighlighting` 用于语法颜色覆盖 |
| `@lezer/highlight` | 1.2.3 | `tags` 提供 keyword/string/comment 等语法 Token 类型 |
| `@codemirror/state` | 6.6.0 | `Extension` 类型定义 |

## 新增文件

| 文件 | 说明 |
|------|------|
| `src/codegen/config/themes.ts` | 12 个主题配置 + `createThemeExtension()` 语法颜色工厂 |
| `src/codegen/config/backgrounds.ts` | 16 种背景预设配置 |

## 修改文件

| 文件 | 改动说明 |
|------|----------|
| `src/codegen/App.tsx` | 重构：集成全部新功能，新增状态/控件/子组件，修复闭包和 DOM 查询 |
| `src/codegen/index.html` | Google Fonts 新增 Fira Code、Source Code Pro、IBM Plex Mono |
| `package.json` | 新增 3 个直接依赖 |

## 代码审查修复记录

1. **Kanagawa 主题配色**：原复制 Tokyo Night 颜色，已修正为真实 Kanagawa palette（lotus/spring/old/wave/crystal）
2. **`bindResize` 闭包陷阱**：新增 `codeRef`、`showHeaderRef`、`fontSizeRef`，回调中使用 ref.current
3. **`onBlur` DOM 查询**：新增 `codeWindowRef`，替换 `document.querySelector('[data-code-window]')`
4. **`createThemeExtension` any 类型**：`{ tag: any }` 修正为 `{ tag: Tag }`（import from `@lezer/highlight`）
5. **TooltipProvider 合并**：背景选择器 12+ 个独立 TooltipProvider 合并为 1 个
6. **主题切换假切换**：`editorBaseTheme` 未同步 `currentTheme.windowBg`/`textColor`，导致 CodeMirror 内部背景和文字颜色不随主题变化。已修复：`editorBaseTheme` 依赖 `currentTheme`，显式设置 `.cm-editor`、`.cm-scroller`、`.cm-content`、`.cm-gutters`、`.cm-cursor`、`.cm-selectionBackground` 的背景色和文字颜色
7. **VS Code Dark+ 缺少语法颜色**：原配置无 `syntax` 字段，导致切换到该主题时使用 CodeMirror 默认高亮色。已补全 9 种语法 Token 颜色定义
8. **标题栏文件名硬编码**：`greet.js` 硬编码为 `<span>`。已改为 `fileName` state + `<input>`，用户可直接编辑
9. **字体切换无反应**：`editorBaseTheme` 的 `fontFamily` 仅设置在 `&`（`.cm-editor`）上，未传播到 `.cm-content` 和 `.cm-gutterElement`。已在所有关键选择器上显式设置 `fontFamily`
10. **水印不显示**：原实现为居中单行文字 + 极低透明度颜色（`rgba(255,255,255,0.15)`）× `opacity`，几乎不可见。已改为 SVG 背景平铺模式（`background-image` + `background-repeat`），旋转 -15° 覆盖整个代码区域
