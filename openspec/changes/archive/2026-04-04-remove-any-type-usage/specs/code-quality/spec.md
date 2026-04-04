## 新增需求

### 需求：测试类型工具

测试代码**必须**使用专用的类型工具，禁止使用 `any` 类型进行 mock 对象断言。

#### 场景：深度部分类型

- **当** 需要创建只包含部分属性的 mock 对象
- **那么** 使用 `PartialDeep<T>` 类型确保类型安全

#### 场景：RefObject mock 类型

- **当** 需要创建 `React.MutableRefObject` 的 mock 对象
- **那么** 使用 `MutableRefObjectMock<T>` 类型确保类型安全

### 需求：无 any 类型

代码库中**禁止**使用 `any` 类型，除非满足特定例外条件。

#### 场景：测试文件类型安全

- **当** 编写测试代码需要 mock 对象
- **那么** 使用类型工具或完整的类型定义，不使用 `any`

#### 场景：必要例外

- **当** 需要 mock 第三方库的复杂类型或浏览器原生 API
- **且** 无法通过类型工具解决
- **那么** 可使用 `// eslint-disable-next-line @typescript-eslint/no-explicit-any` 并添加说明注释
