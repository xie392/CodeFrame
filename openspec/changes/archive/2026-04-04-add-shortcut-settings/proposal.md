# 变更：设置页面实现快捷键配置

## 为什么

当前设置页面仅展示快捷键信息，用户无法自定义快捷键配置。Chrome 原生命令 API 的快捷键只能在 `chrome://extensions/shortcuts` 页面修改，用户体验不佳。需要提供在设置页面直接配置快捷键的能力，提升用户操作效率。

## 变更内容

- 新增自定义快捷键配置系统，支持在设置页面直接修改快捷键
- 保留 Chrome 原生命令作为全局快捷键（不可自定义，保证基础功能可用）
- 实现快捷键录制组件，支持用户通过按键录制新的快捷键组合
- 添加快捷键冲突检测机制，阻止与系统/其他扩展冲突的快捷键设置
- 实现快捷键持久化存储，配置在浏览器重启后保留

## 影响

- 受影响规范：`options`
- 受影响代码：
  - `src/options/App.tsx` - 设置页面布局调整
  - `src/options/components/ShortcutDisplay.tsx` - 重构为可编辑组件
  - `src/shared/stores/settings-store.ts` - 新增快捷键配置存储
  - `src/shared/types.ts` - 扩展快捷键配置类型
  - `src/background/index.ts` - 新增自定义快捷键命令处理
  - `src/content/index.ts` - 新增页面内快捷键监听
