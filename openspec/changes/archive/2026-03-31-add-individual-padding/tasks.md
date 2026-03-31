## 1. 实施
- [x] 1.1 安装 `@radix-ui/react-popover` 依赖
- [x] 1.2 创建 `Popover` UI 基础组件（`src/shared/components/ui/popover.tsx`），遵循 shadcn/ui 风格
- [x] 1.3 将 `padding` 状态从单一 `number` 改为 `{ top: number; right: number; bottom: number; left: number }` 对象，保留向后兼容
- [x] 1.4 创建 `PaddingPopover` 组件，包含四个方向的数值输入（上/右/下/左），内部使用 Popover 包裹
- [x] 1.5 在 LeftPanel 的 padding 滑块旁添加"更多设置"按钮，点击展开 `PaddingPopover`
- [x] 1.6 修改 Background Padding Area 渲染逻辑，使用独立四方向值替代 `padding * 2`
- [x] 1.7 实现"统一/自定义"模式切换逻辑：拖动滑块时四方向同步，修改 Popover 中任一方向时标记为自定义
- [x] 1.8 视觉验证：确认 Popover 弹出方向、四方向输入交互、背景填充渲染正确
