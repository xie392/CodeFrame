# 变更：移除 Popup ActionRow 中的代码编辑器按钮

## 为什么
Popup 页面当前有两个"代码编辑器"入口：
1. ActionRow（快捷操作区）中的按钮图标
2. FeatureList（功能列表区）中的列表项

这种重复设计造成界面冗余，为了简化用户界面、减少视觉干扰，决定移除 ActionRow 中的代码编辑器按钮，保留 FeatureList 中的入口作为主要访问方式。

## 变更内容
- **移除**：Popup 页面 ActionRow 区域的"代码编辑器"按钮
- **保留**：Popup 页面 FeatureList 区域的"代码编辑器"列表项

## 影响
- 受影响规范：`popup/spec.md`
- 受影响代码：`src/popup/App.tsx`（第178-181行）
- 用户影响：代码编辑器功能入口仅通过 FeatureList 提供
