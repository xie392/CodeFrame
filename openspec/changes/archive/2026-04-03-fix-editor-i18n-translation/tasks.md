## 1. 修复 i18n 配置
- [x] 1.1 在 `zh-CN/editor.json` 的 `label` 中添加 `windowStyle: "窗口样式"`
- [x] 1.2 在 `en-US/editor.json` 的 `label` 中添加 `windowStyle: "Window Style"`

## 2. 修复组件代码
- [x] 2.1 修改 `App.tsx:2467` 中 `t('windowStyle')` 为 `t('label.windowStyle')`
- [x] 2.2 修改 `SelectControl` 组件，对 `opt.name` 调用 `t()` 进行翻译

## 3. 验证
- [x] 3.1 构建成功通过
- [ ] 3.2 手动验证中英文翻译正确显示
