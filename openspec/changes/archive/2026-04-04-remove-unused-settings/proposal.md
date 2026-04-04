# 变更：移除设置页面未使用的设置项

## 为什么

设置页面中存在三个设置区块功能冗余或未实现：

1. **历史保留天数** - UI 存在但自动清理逻辑未实现，设置值仅存储未被使用
2. **水印设置** - 编辑器和代码生成器已有独立水印配置，全局设置重复
3. **代码美化设置** - 代码生成器已有完整配置面板，设置页面的配置无实际作用

## 变更内容

- 移除「历史保留天数」设置项（`historyRetention`）
- 移除「水印设置」整个区块（`watermarkEnabled`, `watermarkText`, `watermarkOpacity`）
- 移除「代码美化」整个区块（`codeTheme`, `codeFontSize`, `codeShowLineNumbers`）
- 清理相关类型定义、常量、store、i18n 翻译

## 影响

- 受影响规范：`options`
- 受影响代码：
  - `src/options/App.tsx` - UI 组件
  - `src/shared/types.ts` - UserSettings 接口
  - `src/shared/constants.ts` - 默认值和常量
  - `src/shared/stores/settings-store.ts` - store
  - `src/shared/i18n/locales/zh-CN/options.json` - 中文翻译
  - `src/shared/i18n/locales/en-US/options.json` - 英文翻译
  - 相关测试文件
