## 1. 安装 CodeMirror 主题依赖

- [x] 1.1 调研 `@uiw/codemirror-theme-*` 系列包，确认每个目标主题的包名和导出名
- [x] 1.2 安装所需的 `@uiw/codemirror-theme-*` 主题包

## 2. 重构主题配置

- [x] 2.1 重构 `src/codegen/config/themes.ts` 中的 `ThemeConfig` 接口：移除 `syntax` 字段，新增 `editorTheme` 字段指向 CodeMirror 主题包导出
- [x] 2.2 建立主题 ID → CodeMirror 主题对象的映射（通过 THEMES 数组中的 editorTheme 字段）
- [x] 2.3 移除 `createThemeExtension` 函数和 `SyntaxColors` 接口（不再需要自定义语法高亮，改为由库主题自带）

## 3. 重构编辑器主题加载

- [x] 3.1 移除 `getEditorBaseTheme` 函数，直接使用 `currentTheme.editorTheme` 作为 CodeMirror 的 theme prop
- [x] 3.2 移除 `editorBaseTheme`（`EditorView.theme()`）中的背景色和 gutter 覆盖，仅保留字体和行高配置
- [x] 3.3 移除 `syntaxExtension` 相关代码（`useMemo` 和 `cmExtensions` 中的引用）
- [x] 3.4 gutter 背景色与编辑器背景色一致性问题已根治（由库主题统一控制）

## 4. 替换主题选择器 UI

- [x] 4.1 将色块横滚替换为原生 `<select>` 下拉选择器
- [x] 4.2 下拉选项显示主题名称，选中项显示当前主题名

## 5. 验证

- [x] 5.1 TypeScript 编译通过（零错误）
- [x] 5.2 ESLint 通过（零警告）
- [x] 5.3 Vite 构建通过
- [x] 5.4 代码审查通过（零阻塞性问题）
