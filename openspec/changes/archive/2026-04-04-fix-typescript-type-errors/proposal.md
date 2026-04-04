# 变更：修复 TypeScript 类型错误

## 为什么

执行 `pnpm build` 时出现 70 个 TypeScript 类型错误，分布在 15 个测试文件中，导致构建失败。

## 变更内容

- 移除 7 处未使用的导入和变量（TS6133）
- 添加 jest-dom 类型引用以修复匹配器类型缺失（TS2339）
- 修正测试文件中的类型定义和类型断言（TS2345）
- 修复只读属性赋值和缺失导入问题

## 影响

- 受影响规范：testing
- 受影响代码：
  - `src/vite-env.d.ts`
  - `src/codegen/hooks/__tests__/useExport.test.ts`
  - `src/codegen/hooks/__tests__/useOperationHistory.test.ts`
  - `src/editor/hooks/__tests__/useEditorEvents.test.ts`
  - `src/editor/hooks/__tests__/useEditorHistory.test.ts`
  - `src/editor/hooks/__tests__/useMarqueeSelection.test.ts`
  - `src/editor/hooks/__tests__/useShapeDragging.test.ts`
  - `src/editor/hooks/__tests__/useSyncedRef.test.ts`
  - `src/editor/hooks/__tests__/useTextEditing.test.ts`
  - `src/editor/utils/__tests__/editor.test.ts`
  - `src/shared/components/ui/__tests__/slider.test.tsx`
