# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed

#### 代码质量修复 (2026-04-03)

**类型安全**
- 修复 `src/background/handlers/desktop-capture.ts` 中的 TypeScript any 类型，定义 `ChromeDesktopConstraints` 接口
- 修复 `src/editor/hooks/useEditorEvents.ts` 中的 any 类型，使用 `RectDragType`、`MosaicDragType`、`CropDragType` 类型

**模块规范**
- 修复 `src/codegen/stores/codegen-store.ts` 中的 `require` 导入，改为 ES Module `import`
- 修复 `src/editor/utils/drag-resize.ts` 中的变量声明，将不必要的 `let` 改为 `const`
- 修复 `src/shared/components/ui/select.tsx` 中的未使用参数，添加下划线前缀

**安全增强**
- 在 `src/background/index.ts` 添加消息来源验证，防止恶意消息攻击
- 重构 `src/content/overlay.ts`，使用 DOM API 替代 innerHTML，防止 XSS 攻击
- 在 `src/shared/stores/capture-store.ts` 添加敏感数据过期清理（5分钟过期）

**Bug 修复**
- 修复 `src/codegen/stores/codegen-store.ts` 中 `restoreFromHistory` 函数的多次赋值覆盖问题

### Security

- 更新 vitest 到 1.6.1+ 修复 CVE-2025-24964（Critical 漏洞）
- 更新 vite 到 5.4.x

### Tests

- 测试覆盖率从 17.27% 提升到 60.24%
- 新增 562 个测试用例
- 新增测试模块：
  - `src/background/__tests__/` - background 模块测试
  - `src/codegen/__tests__/` - codegen store 测试
  - `src/content/__tests__/` - content overlay 和 countdown 测试
  - `src/editor/hooks/__tests__/` - editor hooks 完整测试
  - `src/codegen/hooks/__tests__/` - codegen hooks 测试
  - `src/shared/components/ui/__tests__/` - UI 组件测试

---

## Version History

| 版本 | 日期 | 描述 |
|------|------|------|
| - | 2026-04-03 | 代码质量修复、安全增强、测试覆盖率提升 |
