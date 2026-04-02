## 上下文

Editor 的图片导出和复制到剪贴板功能使用 `@zumer/snapdom` 库将 DOM 容器渲染为图片。导出前，需要将 Canvas 上的标注（箭头、矩形、文字、马赛克）绘制到一个临时 Canvas 上，然后叠加到导出容器中。

当前实现存在一个 Bug：当容器比例（aspectRatio）设置为非 `auto` 时，标注在导出图片中的位置不正确。

## 目标 / 非目标

**目标：**
- 修复导出时标注位置计算错误的问题
- 确保标注在导出图片中的位置与画布显示位置完全一致
- 支持所有容器比例设置（auto、预设比例、自定义比例）

**非目标：**
- 不修改标注坐标的存储方式（仍相对于图片左上角）
- 不修改图片容器的布局结构
- 不修改 `calculateAspectRatioSize` 函数

## 决策

**方案：在 `prepareExport` 函数中添加容器尺寸和图片居中偏移计算**

修改 `prepareExport` 函数，使其：

1. 使用 `calculateAspectRatioSize` 计算容器的实际尺寸（考虑 aspectRatio）
2. 计算图片在容器中的居中偏移量：
   ```typescript
   const imageOffsetX = (containerSize.width - displaySize.width) / 2;
   const imageOffsetY = (containerSize.height - displaySize.height) / 2;
   ```
3. 修改 Canvas translate 偏移：
   ```typescript
   // 原来：仅 padding 偏移
   tempCtx.translate(padLeft, padTop);

   // 修改后：padding + 图片居中偏移
   tempCtx.translate(padLeft + imageOffsetX, padTop + imageOffsetY);
   ```

**考虑的替代方案：**

1. **方案 A：修改标注坐标存储方式** - 将标注坐标存储为相对于容器左上角
   - 优点：坐标系统统一
   - 缺点：需要修改大量代码，包括绘制、选择、移动等逻辑
   - 结论：不采用，改动太大

2. **方案 B：在导出时重新计算所有标注坐标** - 临时转换坐标
   - 优点：不影响现有代码
   - 缺点：每次导出都需要计算，代码重复
   - 结论：不采用，translate 更简洁

**最终决策：方案（Canvas translate 偏移）**
- 改动最小，仅需修改 `prepareExport` 函数
- 保持标注坐标存储方式不变
- 利用 Canvas 的 translate 特性简化计算

## 风险 / 权衡

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 计算逻辑错误导致标注位置偏移 | 高 | 编写测试用例验证各种比例设置 |
| 性能影响 | 低 | 计算量极小，可忽略 |
| 与其他功能冲突 | 低 | 仅影响导出功能，不影响编辑功能 |

## 迁移计划

无需迁移，直接修复即可。

## 待决问题

无。
