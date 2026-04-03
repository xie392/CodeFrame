# 变更：代码质量与安全优化

## 为什么

根据全面的代码审查，项目存在以下需要修复的问题：

1. **类型安全问题**：使用 `any` 类型导致类型检查失效
2. **模块规范违反**：在 ES Module 项目中使用 CommonJS `require`
3. **安全漏洞**：开发依赖存在已知漏洞（vitest CVE-2025-24964、esbuild GHSA-67mh-4wv8-2f99）
4. **安全风险**：消息传递缺乏来源验证、innerHTML 存在潜在 XSS 风险
5. **测试覆盖不足**：核心模块（background、content、codegen）缺乏单元测试

这些问题影响代码可维护性、类型安全和扩展安全性，需要在下一版本发布前修复。

## 变更内容

### P0 - 必须修复（阻塞发布）

- 修复 TypeScript `any` 类型使用（4 处）
- 替换 `require` 为 `import` 语句（2 处）
- 修复变量声明规范（`let` → `const`）
- 移除未使用的变量参数
- **更新依赖版本修复安全漏洞**
  - vitest: 1.6.0 → 1.6.1+
  - esbuild: 0.21.5 → 0.25.0+

### P1 - 建议修复（下一版本）

- 添加消息来源验证
- 替换 innerHTML 为 DOM API
- 添加敏感数据清理机制
- 修复 React Hooks 依赖问题
- 补充核心模块单元测试

### P2 - 后续优化

- 优化 structuredClone 性能
- 收紧 content_scripts matches 权限
- 添加集成测试

## 影响

### 受影响规范

- `codegen` - codegen-store.ts 使用 require
- `editor` - useEditorEvents.ts 使用 any 类型
- `screenshot` - desktop-capture.ts 使用 any 类型

### 受影响代码

| 文件 | 问题 | 优先级 |
|------|------|--------|
| `src/background/handlers/desktop-capture.ts:29` | as any | P0 |
| `src/editor/hooks/useEditorEvents.ts:449,517,535` | as any | P0 |
| `src/codegen/stores/codegen-store.ts:255,264` | require 语句 | P0 |
| `src/editor/utils/drag-resize.ts` | let 应为 const | P0 |
| `src/shared/components/ui/select.tsx:10` | 未使用参数 | P0 |
| `package.json` | 依赖漏洞 | P0 |
| `src/background/index.ts:82-187` | 消息验证缺失 | P1 |
| `src/content/overlay.ts:167-178` | innerHTML 风险 | P1 |
| `src/background/handlers/` | 缺乏测试 | P1 |
| `src/content/` | 缺乏测试 | P1 |
| `src/codegen/` | 缺乏测试 | P1 |

### 风险评估

- **低风险**：类型修复、变量声明优化 - 仅影响类型检查，运行时行为不变
- **中风险**：require → import 重构 - 需要测试导入逻辑
- **高风险**：依赖版本更新 - 需要全面测试构建和测试流程

## 成功标准

- [ ] 所有 `any` 类型替换为正确类型
- [ ] 所有 `require` 替换为 `import`
- [ ] 依赖安全漏洞修复（`pnpm audit` 无高危漏洞）
- [ ] 现有测试全部通过
- [ ] 新增核心模块测试覆盖率达到 60%+
- [ ] 构建成功且扩展功能正常
