# 变更：支持代码预览区域单独设置四方向边距

## 为什么
当前 CodeGen 页面的 padding（代码窗口外背景填充边距）只能统一设置一个值，无法单独调整上下左右。用户在某些场景下需要非对称边距（例如下方留更多空间放水印、上方留更少空间紧凑排版），当前统一滑块无法满足此需求。

## 变更内容
- 在 LeftPanel 的 padding 滑块区域新增"更多设置"按钮
- 点击按钮后弹出 Popover 组件（类似 shadcn Popover），内含四个独立的方向输入框（上/右/下/左）
- Popover 从按钮上方弹出，展示四方向独立的数值设置
- 保留原有统一 padding 滑块作为快捷设置，修改任一方向时自动切换为"自定义"模式
- 背景填充区域渲染逻辑从 `padding * 2` 改为支持非对称四方向值

## 影响
- 受影响规范：`codegen`
- 受影响代码：`src/codegen/App.tsx`（padding 状态、LeftPanel UI、Background Padding Area 渲染）
