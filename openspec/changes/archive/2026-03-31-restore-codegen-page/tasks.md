## 1. 基础设施准备

- [x] 1.1 确认 Vite 构建后 codegen 页面的输出路径，验证 `chrome.runtime.getURL` 可正确访问
- [x] 1.2 在 manifest.json 中注册 codegen 页面（web_accessible_resources 或其他方式），确保扩展能正确打开该页面

## 2. Popup 跳转逻辑

- [x] 2.1 在 `src/popup/App.tsx` 中实现 `handleOpenCodeEditor` 函数，使用 `chrome.tabs.create` 在新标签页打开 codegen 页面
- [x] 2.2 将 FeatureList 中"代码编辑器"按钮的 `onClick` 从 `console.log('code editor')` 替换为 `handleOpenCodeEditor`

## 3. CodeGen 页面 UI 还原

- [x] 3.1 创建 CodeGen 页面整体布局：1440×900 全屏容器，渐变背景 (#1E1E30 → #151525 → #0D0D18)，圆角 16px
- [x] 3.2 实现 LeftPanel（宽 360px）：毛玻璃效果面板，包含 panelHeader、commentLine、CodeArea、LangSection、ThemeSection、BgSection、ExportBtn
- [x] 3.3 实现 CodeArea 代码输入区域（300px 高）：深色背景 (#FFFFFF08)，带边框和阴影，包含示例代码占位
- [x] 3.4 实现 LangSection 语言选择器：`language` 标签 + 下拉选择器样式（javascript + chevron-down 图标）
- [x] 3.5 实现 ThemeSection 主题选择：`theme` 标签 + 4 个主题色块（#1E1E1E 选中态 #FF6B35 边框、#282C34、#002B36、#FAFAFA）
- [x] 3.6 实现 BgSection 背景色选择：`background` 标签 + 5 个背景色块（#6366F1 选中态 check 图标、#8B5CF6、#EC4899、#0EA5E9、#10B981）
- [x] 3.7 实现 ExportBtn 导出按钮：#00D4AA 背景、`$ export_image` 文字、image 图标
- [x] 3.8 实现 PreviewArea 代码预览区域：#6366F1 紫色背景 + CodeWindow（520×380，仿 VS Code 窗口，含红黄绿圆点 + 文件名 + 代码预览）

## 4. 验证

- [x] 4.1 验证构建成功，codegen 页面可正常打包
- [x] 4.2 验证 Popup 中"代码编辑器"按钮能正确打开 codegen 新标签页
- [x] 4.3 验证 CodeGen 页面 UI 与设计稿一致
