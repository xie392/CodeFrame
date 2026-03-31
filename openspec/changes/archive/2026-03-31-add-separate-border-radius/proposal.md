# 变更：圆角控制拆分为外框和内框独立设置

## 为什么

当前 codegen 页面的圆角滑块缺少标题标签（SectionLabel），放置在 shadow 控制下方，导致用户误以为是 shadow 的子控制。此外，圆角使用单一值同时控制外框（背景填充区域）和内框（代码窗口），无法独立调节。用户需要像边距控制一样，能分别设置外框和内框的圆角。

## 变更内容

- 为圆角滑块添加 `SectionLabel` 标题（类似 padding 的 `padding` 标签）
- 将单一的 `borderRadius` 状态拆分为 `outerBorderRadius`（外框/背景填充区域）和 `innerBorderRadius`（内框/代码窗口）两个独立状态
- 参考边距控制的 Popover 模式，为圆角提供「统一/自定义」切换能力
- 外框和内框各有独立滑块控制
- **重大变更**：`borderRadius` 单一值替换为 `outerBorderRadius` + `innerBorderRadius` 双值，旧数据需迁移

## 影响

- 受影响规范：`codegen`
- 受影响代码：
  - `src/codegen/App.tsx` — 状态声明、控制面板 UI、画布渲染样式
  - `src/shared/types.ts` — `BeautifyOptions.borderRadius` 类型需扩展
