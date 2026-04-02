## 1. 类型定义

- [x] 1.1 在 `types.ts` 中添加 `ImageFrameSettings` 类型定义
- [x] 1.2 在 `App.tsx` 中添加 `frameSettings` 状态（仅默认值，暂不实现逻辑）

## 2. UI 组件

- [x] 2.1 创建 `FrameSettings` 组件容器
- [x] 2.2 创建 `BackgroundSection` 背景设置区块
- [x] 2.3 创建 `PaddingSection` 边距设置区块
- [x] 2.4 创建 `BorderRadiusSection` 圆角设置区块
- [x] 2.5 创建 `ShadowSection` 阴影设置区块
- [x] 2.6 创建 `AspectRatioSection` 比例设置区块
- [x] 2.7 创建 `WindowControlSection` 窗口控件区块
- [x] 2.8 创建 `WatermarkSection` 水印设置区块

## 3. 属性面板整合

- [x] 3.1 修改 `PropertiesPanel` 组件结构
- [x] 3.2 未选中标注时显示 `[frame]` 区域
- [x] 3.3 添加展开/折叠交互

## 4. UI 控件复用

- [x] 4.1 复用 `ColorPicker` 组件用于背景和阴影颜色
- [x] 4.2 复用 `SliderControl` 组件用于各数值设置
- [x] 4.3 复用 `EditableField` 组件用于边距和圆角输入
