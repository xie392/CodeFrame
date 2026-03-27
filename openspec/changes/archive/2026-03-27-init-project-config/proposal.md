# 变更：初始化项目配置

## 为什么

CodeFrame 项目目前仅有设计文档，需要初始化完整的项目配置，包括构建工具、TypeScript、样式方案、代码质量工具等，为后续功能开发奠定基础。

## 变更内容

### 项目结构初始化
- 创建 `src/` 目录结构（background/popup/editor/codegen/content/shared/options）
- 创建 `public/` 目录（icons/themes）
- 创建配置文件目录

### 构建配置
- 初始化 `package.json`，定义项目依赖和脚本
- 配置 Vite + CRXJS 构建 Chrome 扩展
- 配置 Manifest V3 扩展清单

### TypeScript 配置
- 配置 `tsconfig.json`（严格模式、路径别名）
- 配置类型声明文件

### 样式配置
- 配置 TailwindCSS
- 定义 CSS Variables 主题系统
- 配置字体（JetBrains Mono、IBM Plex Mono）

### 代码质量配置
- 配置 ESLint（TypeScript 规则）
- 配置 Prettier（格式化规则）
- 配置 Git Hooks（husky、lint-staged）

## 影响

- 受影响规范：
  - project-structure/spec.md（新增）
  - build-config/spec.md（新增）
  - typescript/spec.md（新增）
  - style-config/spec.md（新增）
  - code-quality/spec.md（新增）
- 受影响文件：项目根目录所有配置文件
- 依赖关系：此变更为所有后续功能开发的前置条件
