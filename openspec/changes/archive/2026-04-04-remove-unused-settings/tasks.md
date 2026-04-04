## 1. 移除 UI 组件

- [x] 1.1 移除设置页面中的「历史保留天数」设置项
- [x] 1.2 移除设置页面中的「水印设置」区块
- [x] 1.3 移除设置页面中的「代码美化」区块

## 2. 清理类型和常量

- [x] 2.1 从 `UserSettings` 接口移除废弃字段
- [x] 2.2 从 `constants.ts` 移除 `HISTORY_RETENTION_OPTIONS` 和相关默认值
- [x] 2.3 从 `constants.ts` 移除 `CODE_THEME_OPTIONS`（如果仅用于设置页面）
- [x] 2.4 清理 `settings-store.ts` 中的废弃字段

## 3. 清理 i18n 翻译

- [x] 3.1 从中文翻译文件移除废弃的标签
- [x] 3.2 从英文翻译文件移除废弃的标签

## 4. 更新测试

- [x] 4.1 更新 `settings-store.test.ts` 测试用例
- [x] 4.2 更新 `useOperationHistory.test.ts` 测试用例

## 5. 验证

- [x] 5.1 运行 `pnpm lint` 检查代码风格
- [x] 5.2 运行 `pnpm test` 确保测试通过
- [x] 5.3 运行 `pnpm build` 确保构建成功
