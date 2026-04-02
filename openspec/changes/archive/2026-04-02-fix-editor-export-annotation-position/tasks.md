## 1. 修复实施

- [x] 1.1 分析 `prepareExport` 函数当前的容器尺寸计算逻辑
- [x] 1.2 添加 `calculateAspectRatioSize` 调用以获取正确的容器尺寸
- [x] 1.3 计算图片在容器中的居中偏移量（imageOffsetX, imageOffsetY）
- [x] 1.4 修改 Canvas translate 偏移，包含 padding 和图片居中偏移
- [x] 1.5 更新 `prepareExport` 的依赖数组，添加 aspectRatio 相关依赖

## 2. 验证测试

- [x] 2.1 测试 aspectRatio 为 `auto` 时导出功能正常
- [x] 2.2 测试 aspectRatio 为预设比例（如 1:1、16:9）时导出功能正常
- [x] 2.3 测试 aspectRatio 为自定义比例时导出功能正常
- [x] 2.4 测试复制到剪贴板功能在各种比例设置下正常
- [x] 2.5 验证箭头、矩形、马赛克等其他标注的导出位置也正确
