## 1. 移除类型定义

- [x] 1.1 `src/shared/types.ts` — 移除 `UserSettings.theme` 字段

## 2. 移除常量定义

- [x] 2.1 `src/shared/constants.ts` — 移除 `THEME_OPTIONS` 常量
- [x] 2.2 `src/shared/constants.ts` — 移除 `THEME_LABELS` 常量
- [x] 2.3 `src/shared/constants.ts` — 移除 `DEFAULT_SETTINGS.theme` 字段

## 3. 移除 Store 初始化

- [x] 3.1 `src/shared/stores/settings-store.ts` — 移除 `defaultSettings.theme` 初始化

## 4. 移除 UI 组件

- [x] 4.1 `src/options/App.tsx` — 移除"默认主题"设置项（第 90-98 行）
- [x] 4.2 `src/options/App.tsx` — 移除 `Globe` 图标导入（若不再使用）
- [x] 4.3 `src/options/App.tsx` — 移除 `THEME_LABELS` 导入

## 5. 验证

- [x] 5.1 构建通过，无 TypeScript 错误
- [x] 5.2 Options 页面正常显示，无"默认主题"设置项
- [x] 5.3 其他设置项功能正常
