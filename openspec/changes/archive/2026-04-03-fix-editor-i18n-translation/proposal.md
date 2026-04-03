# 变更：修复 Editor 页面 i18n 翻译问题

## 为什么

Editor 页面存在 i18n 翻译错误，导致用户看到未翻译的 key 值而非对应语言文本：
1. `windowStyle` 显示错误 "key 'windowStyle (zh-CN)' returned an object instead of string"
2. 比例选项显示原始 key（如 `aspectRatio.auto`）而非翻译后的中文文本

## 变更内容

### 问题根因
1. **`windowStyle` 结构问题**：`editor.json` 中 `windowStyle` 是嵌套对象而非字符串，`t('windowStyle')` 返回整个对象
2. **`SelectControl` 组件问题**：直接渲染 `opt.name` 而未调用 `t()` 进行翻译

### 修复方案
1. 在 `editor.json` 的 `label` 对象中添加 `windowStyle` 字符串
2. 修改 `App.tsx` 中 `t('windowStyle')` 为 `t('label.windowStyle')`
3. 修改 `SelectControl` 组件，对 `opt.name` 进行 i18n 翻译

## 影响

- 受影响规范：`i18n`
- 受影响代码：
  - `src/editor/App.tsx` - `SelectControl` 组件、`windowStyle` 使用处
  - `src/shared/i18n/locales/zh-CN/editor.json` - 添加 `label.windowStyle`
  - `src/shared/i18n/locales/en-US/editor.json` - 添加 `label.windowStyle`
