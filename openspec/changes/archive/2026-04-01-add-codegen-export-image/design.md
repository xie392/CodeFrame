## 上下文

CodeGen 是一个代码美化截图工具，用户在左侧面板配置主题、背景、水印等参数，右侧实时预览代码窗口效果。当前导出按钮为纯 UI 占位（`App.tsx:910-921`），无任何功能实现。项目已安装 `@zumer/snapdom ^2.7.0`（零依赖、高性能 DOM 截图库），且扩展已申请 `clipboardWrite` 权限。

## 目标 / 非目标

- 目标：
  - 用户可将代码窗口导出为 PNG 图片并下载
  - 用户可一键复制代码窗口截图到系统剪贴板
  - 导出/复制范围包含完整的背景填充区域 + 代码窗口 + 水印
- 非目标：
  - 不支持 SVG/JPG/WEBP 等其他格式（后续迭代）
  - 不实现导出质量/分辨率设置（使用默认 2x 像素比）
  - 不实现导出进度条（图片生成速度足够快）

## 决策

### 决策 1：使用 `@zumer/snapdom` 的 `toPng` 方法

- **原因**：项目已安装该依赖；snapdom 基于 SVG foreignObject，在 Chrome 扩展环境中无 CORS/WASM 问题；相比 `html-to-image`，snapdom 性能快 15-25 倍（复杂元素），完整支持 `backdrop-filter`、伪元素等 CSS 特性，零依赖、体积更小（~8KB），且维护活跃（2026 年仍在更新，html-to-image 已停更超 1 年）
- **考虑的替代方案**：
  - `html-to-image`：已停更超 1 年，性能较差（复杂元素 ~429ms vs snapdom ~17.5ms），存在未修复的 `backdrop-filter` bug（Issue #239）和 foreignObject 回归 bug（Issue #520）
  - `dom-to-image`：已停止维护，存在已知 bug
  - `html2canvas`：基于 Canvas 重绘，对 CSS 支持不完整，且在 Shadow DOM 中有问题
  - 原生 Canvas API 手绘：工作量大，维护成本高

### 决策 2：导出目标 DOM 节点为背景填充区域的容器

- **原因**：用户期望导出包含背景色/渐变 + 代码窗口 + 水印的完整截图，而非仅代码窗口本身
- **实现**：对 `PreviewArea` 中背景填充区域的最外层容器（`ref`）执行 `toPng`

### 决策 3：复制到剪贴板使用 `navigator.clipboard.write` + `ClipboardItem`

- **原因**：Chrome 扩展已有 `clipboardWrite` 权限，现代 Chrome 支持将 PNG Blob 写入剪贴板
- **实现**：先用 snapdom 生成 Blob，再通过 `navigator.clipboard.write` 写入

### 决策 4：按钮组布局为「导出图片」主按钮 + 右侧「复制」小按钮

- **原因**：主操作是导出下载（全宽按钮），复制到剪贴板是辅助操作（小按钮），放在主按钮右侧紧凑排列
- **实现**：使用 flex 布局，主按钮 `flex-1`，复制按钮固定宽度

## 风险 / 权衡

- **风险**：snapdom v2 架构较新，API 可能存在未发现的边界问题
  - **缓解措施**：导出前验证目标 DOM 节点可访问，添加 try-catch 错误处理
- **风险**：高 DPI 屏幕下导出图片可能模糊
  - **缓解措施**：默认使用 `scale: 2` 生成 2x 分辨率图片
- **风险**：剪贴板 API 在某些浏览器版本可能不支持
  - **缓解措施**：添加兼容性检测，不支持时显示提示信息

## 待决问题

- 是否需要导出时自动隐藏编辑器光标？建议是，避免截图中出现闪烁光标。
