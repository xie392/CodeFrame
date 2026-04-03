# 变更：移除设置中的主题切换

## 为什么

系统当前不支持主题切换功能，只使用单一主题（当前亮色玻璃拟态风格）。设置页面中的"默认主题"选项为无效配置，会造成用户困惑。移除此选项可：
1. 避免用户误以为可以切换主题
2. 简化设置项，减少维护成本
3. 与 `remove-dark-theme` 变更保持一致（Popup 已移除主题切换按钮）

## 变更内容

- **移除** Options 页面"默认主题"设置项（`src/options/App.tsx`）
- **移除** `THEME_OPTIONS` 和 `THEME_LABELS` 常量（`src/shared/constants.ts`）
- **移除** `UserSettings.theme` 类型字段（`src/shared/types.ts`）
- **移除** `DEFAULT_SETTINGS.theme` 默认值（`src/shared/constants.ts`）
- **移除** `settings-store.ts` 中的 `theme` 初始化（`src/shared/stores/settings-store.ts`）

## 影响

- 受影响规范：options/spec.md（修改需求：移除主题切换场景）
- 受影响代码：
  - `src/options/App.tsx` — 移除主题设置项 UI
  - `src/shared/constants.ts` — 移除主题相关常量
  - `src/shared/types.ts` — 移除 theme 类型字段
  - `src/shared/stores/settings-store.ts` — 移除 theme 初始化
- 依赖关系：与 `remove-dark-theme` 变更互补，共同完成主题功能的移除
