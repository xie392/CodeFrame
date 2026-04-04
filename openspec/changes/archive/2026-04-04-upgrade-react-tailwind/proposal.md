# 变更：升级 React 19 和 Tailwind CSS v4

## 为什么

React 19 和 Tailwind CSS v4 带来了重大改进和新特性，升级后可获得更好的开发体验和性能优化。
同时更新 @types/chrome 和 eslint-plugin-react-hooks 以保持依赖最新。

## 变更内容

### React 19 升级
- **重大变更** React 18 → React 19
- **重大变更** @types/react 18 → 19
- **重大变更** @types/react-dom 18 → 19

### Tailwind CSS v4 升级
- **重大变更** Tailwind CSS v3 → v4
- **重大变更** 需要迁移配置文件和 PostCSS 配置
- 新增 @tailwindcss/postcss 包

### 其他依赖更新
- @types/chrome 0.0.263 → 0.1.39
- eslint-plugin-react-hooks 4.6.0 → 7.0.1
- eslint-plugin-react-refresh 0.4.5 → 0.5.2

## 影响

### 受影响规范
- 无功能规范变更

### 受影响代码
- `tailwind.config.js` → 迁移到 Tailwind v4 配置
- `postcss.config.js` → 更新 PostCSS 插件
- `src/**/*.tsx` → 修复 RefObject 类型错误
- `src/codegen/hooks/useCurrent.ts` → 修复 React hooks 规则错误
- `src/editor/hooks/useSyncedRef.ts` → 修复 React hooks 规则错误
- `src/background/handlers/desktop-capture.ts` → 修复 @types/chrome 类型错误
- `src/shared/i18n/*.ts` → 修复 @types/chrome 类型错误

### 破坏性变更
1. React 19 RefObject 类型更严格，不允许 null 赋值给非 null 类型
2. Tailwind v4 配置格式完全改变，需要重写配置文件
3. eslint-plugin-react-hooks 7.0 新增更严格的规则检查
4. @types/chrome 类型定义变更，部分 API 类型更严格

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| React 19 生态兼容性 | 中 | 确保所有依赖兼容 React 19 |
| Tailwind v4 迁移 | 高 | 按官方迁移指南逐步迁移 |
| 类型错误修复 | 中 | 逐文件修复类型问题 |
| ESLint 规则变更 | 低 | 修复或禁用新规则 |
