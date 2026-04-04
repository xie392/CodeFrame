## 1. 实施

- [x] 1.1 移除未使用的导入（TS6133）
  - `waitFor` from useExport.test.ts
  - `act` from useEditorEvents.test.ts
  - `beforeEach` from useEditorHistory.test.ts
  - `userEvent` from slider.test.tsx
  - `originalLocation` 变量 from editor.test.ts
  - `minSize`, `bounds` 参数 from useShapeDragging.test.ts

- [x] 1.2 添加 jest-dom 类型引用
  - 在 `src/vite-env.d.ts` 添加 `@testing-library/jest-dom/vitest` 类型引用

- [x] 1.3 修复类型不匹配（TS2345）
  - useOperationHistory.test.ts: 补全 SettingsState 所需属性
  - useMarqueeSelection.test.ts: 补全 ArrowShape 等类型所有必需属性
  - useSyncedRef.test.ts: 修复 undefined/null 类型赋值

- [x] 1.4 修复属性不存在错误（TS2339）
  - useEditorHistory.test.ts: 使用类型断言解决 never 类型问题
  - useTextEditing.test.ts: 移除不存在属性、添加缺失导入

- [x] 1.5 修复其他错误
  - useEditorEvents.test.ts: 修复 getContext 类型
  - useTextEditing.test.ts: 使用 Object.defineProperty 解决只读属性赋值

## 2. 验证

- [x] 2.1 运行 `pnpm build` 确认构建通过
- [x] 2.2 运行 `pnpm test` 确认测试通过（555 tests）
