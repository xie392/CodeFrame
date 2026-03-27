## 新增需求

### 需求：TypeScript 编译配置

项目**必须**有严格的 TypeScript 配置。

#### 场景：编译选项

- **当** 开发者查看 `tsconfig.json`
- **那么** `compilerOptions` **必须**包含：
  - `target`: "ES2020"
  - `module`: "ESNext"
  - `moduleResolution`: "bundler"
  - `strict`: true
  - `noEmit`: true
  - `skipLibCheck`: true
  - `esModuleInterop`: true
  - `allowSyntheticDefaultImports`: true

#### 场景：严格模式

- **当** TypeScript 编译代码
- **那么** **必须**启用严格类型检查：
  - `strict`: true
  - `noImplicitAny`: true
  - `strictNullChecks`: true
  - `strictFunctionTypes`: true

#### 场景：路径别名

- **当** 开发者在代码中使用 `@/` 前缀
- **那么** TypeScript **必须**正确解析类型

- **当** 开发者查看 `paths` 配置
- **那么** **必须**包含：
  - `@/*`: `["./src/*"]`
  - `@shared/*`: `["./src/shared/*"]`

### 需求：类型声明文件

项目**必须**有完整的类型声明文件。

#### 场景：Vite 环境类型

- **当** 开发者查看 `src/vite-env.d.ts`
- **那么** 文件**必须**引用 `vite/client` 类型

#### 场景：全局类型声明

- **当** 开发者查看 `src/types/global.d.ts`
- **那么** 文件**必须**定义全局类型声明

#### 场景：Chrome 扩展 API 类型

- **当** 开发者使用 Chrome API
- **那么** TypeScript **必须**提供正确的类型提示

- **当** 开发者查看 `src/types/chrome.d.ts`
- **那么** 文件**必须**扩展 `chrome` 命名空间

### 需求：Node.js 类型配置

项目**必须**有独立的 Node.js 配置文件。

#### 场景：Vite 配置文件类型检查

- **当** TypeScript 检查 `vite.config.ts`
- **那么** **必须**使用 `tsconfig.node.json` 配置
