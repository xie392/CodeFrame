## 1. 基础设施

- [x] 1.1 引入 `@zumer/snapdom` 库
- [x] 1.2 添加导出状态管理（isExporting、copied）

## 2. 导出图片功能

- [x] 2.1 创建 `handleExportImage` 函数
- [x] 2.2 导出前将 Canvas 标注图层渲染为图片并叠加到容器
- [x] 2.3 使用 `snapdom.toPng` 渲染图片容器（包含背景、标注、水印）
- [x] 2.4 使用 `scale: 2` 保证高清输出
- [x] 2.5 触发浏览器下载，文件名格式为 `codeframe-{timestamp}.png`
- [x] 2.6 添加导出中 loading 状态反馈

## 3. 复制到剪贴板功能

- [x] 3.1 创建 `handleCopyToClipboard` 函数
- [x] 3.2 使用 `snapdom.toBlob` 生成 PNG Blob
- [x] 3.3 通过 `navigator.clipboard.write` 写入剪贴板
- [x] 3.4 添加复制成功反馈（按钮文字变化）
- [x] 3.5 添加浏览器兼容性检测

## 4. 验证

- [x] 4.1 验证导出图片包含完整背景、图片、标注、水印
- [x] 4.2 验证复制到剪贴板可正常粘贴
- [x] 4.3 验证缩放/偏移状态下导出正确
