## 1. UI 改造
- [x] 1.1 将现有导出按钮改造为按钮组：主按钮（导出图片）+ 右侧小按钮（复制到剪贴板）
- [x] 1.2 为复制按钮添加 Tooltip 提示文字

## 2. 导出图片功能
- [x] 2.1 创建 `handleExportImage` 函数，使用 `@zumer/snapdom` 的 `toPng` 方法
- [x] 2.2 导出目标为背景填充区域容器（包含背景 + 代码窗口 + 水印）
- [x] 2.3 使用 `scale: 2` 保证高清输出
- [x] 2.4 通过创建 `<a>` 标签触发下载，文件名格式为 `codeframe-{timestamp}.png`
- [x] 2.5 添加导出中的 loading 状态反馈（按钮禁用 + 文字变化）

## 3. 复制到剪贴板功能
- [x] 3.1 创建 `handleCopyToClipboard` 函数，使用 `@zumer/snapdom` 生成 Blob
- [x] 3.2 通过 `navigator.clipboard.write` + `ClipboardItem` 写入 PNG 图片
- [x] 3.3 添加复制成功的 Toast/视觉反馈
- [x] 3.4 添加兼容性检测，不支持时显示错误提示

## 4. 验证
- [x] 4.1 验证导出图片包含完整的背景色、代码窗口、水印
- [x] 4.2 验证复制到剪贴板后可粘贴到其他应用
- [x] 4.3 验证导出时编辑器光标不出现
