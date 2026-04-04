## 1. 准备工作

- [x] 1.1 创建测试类型工具文件 `src/test-utils/types.ts`
- [x] 1.2 定义 `PartialDeep<T>` 深度部分类型
- [x] 1.3 定义 `MutableRefObjectMock<T>` 类型

## 2. 修复 vitest.setup.ts

- [x] 2.1 分析 Canvas API mock 的类型需求
- [x] 2.2 创建 `MockCanvasRenderingContext2D` 类型定义
- [x] 2.3 使用正确的类型断言替代 `any`（保留必要的 eslint-disable 注释）

## 3. 修复 useExport.test.ts

- [x] 3.1 创建完整类型的 `mockFrameSettings` 对象
- [x] 3.2 使用 `createRefMock<T>` 替代 `as any`
- [x] 3.3 修复 `useSettingsStore` mock 返回值类型
- [x] 3.4 验证所有测试用例通过

## 4. 修复 useCrop.test.ts

- [x] 4.1 修复 `HTMLCanvasElement.getContext` mock 类型（保留必要的 eslint-disable 注释）
- [x] 4.2 修复 `window.Image` mock 类型（保留必要的 eslint-disable 注释）
- [x] 4.3 验证所有测试用例通过

## 5. 修复 useEditorEvents.test.ts

- [x] 5.1 修复 canvas `getContext` mock 类型（保留必要的 eslint-disable 注释）
- [x] 5.2 验证所有测试用例通过

## 6. 验证

- [x] 6.1 运行 `pnpm lint` 确保无 ESLint 错误 ✓ (20 warnings, 0 errors)
- [x] 6.2 运行 `pnpm test` 确保所有测试通过 ✓ (553 passed, 1 skipped)
- [x] 6.3 运行 `pnpm build` 确保构建成功 ✓
- [x] 6.4 确认代码库中 `any` 使用从 77 处减少到 3 处（均为测试文件中的必要例外）
