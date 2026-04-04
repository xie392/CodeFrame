# 变更：移除项目中 `any` 类型的使用

## 为什么

项目 `openspec/project.md` 明确规定"无 any 类型"作为 TypeScript 代码规范，但当前代码库中仍存在 77 处 `any` 类型使用，违反了项目的类型安全约定。

使用 `any` 类型会：
- 绕过 TypeScript 的类型检查，失去类型安全保障
- 增加运行时错误风险
- 降低代码可维护性
- 隐藏潜在的类型错误

## 变更内容

- 移除测试文件中用于 mock 对象的 `as any` 类型断言
- 创建测试专用的类型工具，支持部分属性 mock
- 使用正确的类型断言方式处理 DOM API mock
- 更新 `vitest.setup.ts` 中的全局 mock 类型处理

### 受影响文件

| 文件 | any 使用数 | 原因分类 |
|------|-----------|----------|
| `vitest.setup.ts` | 2 | 全局 Canvas API mock |
| `useExport.test.ts` | 72 | Mock 对象部分属性 |
| `useCrop.test.ts` | 2 | HTMLCanvasElement/Image mock |
| `useEditorEvents.test.ts` | 1 | Canvas getContext mock |

## 影响

- 受影响规范：无（代码质量改进，不涉及功能变更）
- 受影响代码：
  - `vitest.setup.ts`
  - `src/editor/hooks/__tests__/useExport.test.ts`
  - `src/editor/hooks/__tests__/useCrop.test.ts`
  - `src/editor/hooks/__tests__/useEditorEvents.test.ts`

### 解决方案

1. **创建测试类型工具** (`src/test-utils/types.ts`)
   - `PartialDeep<T>` - 深度部分类型，支持嵌套对象的部分 mock
   - `MutableRefObjectMock<T>` - RefObject mock 类型

2. **使用正确的类型断言**
   - 对于函数重载类型冲突，使用类型守卫或更精确的类型断言
   - 对于浏览器 API mock，使用 `vi.fn()` 配合正确的函数签名

3. **分离必要的类型断言**
   - 对于确需绕过类型检查的场景，添加 `eslint-disable` 注释说明原因
