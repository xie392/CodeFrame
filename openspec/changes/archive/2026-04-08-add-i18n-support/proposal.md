# 变更：添加界面语言国际化支持

## 为什么

CodeFrame 当前所有界面文字都是硬编码的中文，虽然设置页面已有语言选择器，但切换后不会实际改变界面语言。为了支持国际化用户，需要实现完整的国际化（i18n）系统，让用户能够在中文和英文之间切换界面语言。

## 变更内容

- 搭建 i18n 国际化框架（使用 i18next + react-i18next）
- 创建中文（zh-CN）和英文（en-US）语言包
- 实现语言切换响应机制（监听设置变化，自动更新界面）
- 替换所有硬编码文字为 i18n 翻译调用
- 支持以下模块的国际化：
  - Options 设置页面
  - Popup 弹窗页面
  - Editor 编辑器页面
  - CodeGen 代码生成器页面
  - Content Scripts（遮罩层、倒计时提示）

## 影响

- 受影响规范：`specs/options/spec.md`（语言切换场景已有，需补充国际化实现说明）
- 受影响代码：
  - `src/options/App.tsx` - 设置页面国际化
  - `src/popup/App.tsx` - 弹窗页面国际化
  - `src/editor/App.tsx` - 编辑器页面国际化
  - `src/codegen/App.tsx` - 代码生成器国际化
  - `src/content/overlay.ts` - 遮罩层文字国际化
  - `src/content/countdown.ts` - 倒计时提示国际化
  - `src/shared/` - 新增 i18n 模块
- 新增依赖：`i18next`, `react-i18next`
