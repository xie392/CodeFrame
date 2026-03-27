## 新增需求

### 需求：ESLint 配置

项目**必须**有完整的 ESLint 配置。

#### 场景：ESLint 配置文件

- **当** 开发者查看 `.eslintrc.cjs`
- **那么** 文件**必须**包含：
  - TypeScript 解析器配置
  - React 推荐规则
  - TypeScript 推荐规则
  - Prettier 集成

#### 场景：TypeScript 规则

- **当** ESLint 检查 TypeScript 代码
- **那么** **必须**启用以下规则：
  - `@typescript-eslint/no-explicit-any`: error
  - `@typescript-eslint/no-unused-vars`: error
  - `@typescript-eslint/explicit-module-boundary-types`: warn

#### 场景：React 规则

- **当** ESLint 检查 React 代码
- **那么** **必须**启用以下规则：
  - `react-hooks/rules-of-hooks`: error
  - `react-hooks/exhaustive-deps`: warn

### 需求：Prettier 配置

项目**必须**有统一的 Prettier 配置。

#### 场景：Prettier 配置文件

- **当** 开发者查看 `.prettierrc`
- **那么** 文件**必须**包含：
  - `printWidth`: 80
  - `tabWidth`: 2
  - `useTabs`: false
  - `semi`: false
  - `singleQuote`: true
  - `trailingComma`: "es5"
  - `bracketSpacing`: true
  - `arrowParens`: "always"

#### 场景：Prettier 忽略文件

- **当** 开发者查看 `.prettierignore`
- **那么** 文件**必须**忽略以下路径：
  - `dist/`
  - `node_modules/`
  - `*.min.js`

### 需求：Git Hooks 配置

项目**必须**配置 Git Hooks 确保代码质量。

#### 场景：Husky 初始化

- **当** 开发者查看 `.husky/` 目录
- **那么** 目录**必须**包含 `pre-commit` hook

#### 场景：Pre-commit Hook

- **当** 开发者执行 `git commit`
- **那么** **必须**执行 `lint-staged`

#### 场景：Lint-staged 配置

- **当** 开发者查看 `package.json` 中的 `lint-staged`
- **那么** 配置**必须**对以下文件执行检查：
  - `*.{js,jsx,ts,tsx}`: eslint --fix, prettier --write
  - `*.{css,scss,json,md}`: prettier --write

### 需求：EditorConfig

项目**必须**有 `.editorconfig` 配置文件。

#### 场景：编辑器配置

- **当** 开发者查看 `.editorconfig`
- **那么** 文件**必须**定义：
  - `indent_style`: space
  - `indent_size`: 2
  - `end_of_line`: lf
  - `charset`: utf-8
  - `trim_trailing_whitespace`: true
  - `insert_final_newline`: true
