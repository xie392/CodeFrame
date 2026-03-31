## 1. 数据层改造
- [x] 1.1 在 `App.tsx` 中将 `borderRadius` 单一状态拆分为 `outerBorderRadius`（默认 16px）和 `innerBorderRadius`（默认 12px）两个独立状态
- [x] 1.2 更新 `src/shared/types.ts` 中 `BeautifyOptions.borderRadius` 为 `{ outer: number; inner: number }` 结构

## 2. UI 控制面板改造
- [x] 2.1 为圆角控制区域添加 `SectionLabel` 标题（`border_radius`）
- [x] 2.2 实现「统一/自定义」模式切换逻辑（参考 padding 的 `isUniformPadding` 模式）
- [x] 2.3 统一模式下显示单个滑块，拖动时同步更新外框和内框圆角
- [x] 2.4 自定义模式下显示两个独立滑块（外框 outer、内框 inner），各自可调节 0-30px

## 3. 画布渲染更新
- [x] 3.1 更新背景填充区域（外框）的 `borderRadius` 使用 `outerBorderRadius`
- [x] 3.2 更新代码窗口整体、标题栏、窗口主体的 `borderRadius` 使用 `innerBorderRadius`

## 4. 验证
- [x] 4.1 确认默认值渲染效果与当前一致（外框 16px，内框 12px）
- [x] 4.2 确认统一模式切换到自定义模式时 UI 状态正确
- [x] 4.3 确认导出图片中圆角渲染正确
