## 新增需求

### 需求：package.json 配置

项目**必须**有完整的 `package.json` 配置文件。

#### 场景：项目基本信息

- **当** 开发者查看 `package.json`
- **那么** 文件**必须**包含：
  - `name`: "codeframe"
  - `version`: "1.0.0"
  - `type`: "module"
  - `scripts`: 开发/构建/预览脚本

#### 场景：依赖配置

- **当** 开发者安装依赖
- **那么** `package.json` **必须**包含以下核心依赖：
  - `react`, `react-dom` - UI 框架
  - `vite` - 构建工具
  - `@crxjs/vite-plugin` - Chrome 扩展插件
  - `typescript` - TypeScript 编译器
  - `tailwindcss` - 样式框架

#### 场景：脚本命令

- **当** 开发者运行 `pnpm dev`
- **那么** **必须**启动开发服务器并支持 HMR

- **当** 开发者运行 `pnpm build`
- **那么** **必须**构建生产版本到 `dist/` 目录

### 需求：Vite 配置

项目**必须**有完整的 `vite.config.ts` 配置文件。

#### 场景：CRXJS 插件配置

- **当** 开发者查看 `vite.config.ts`
- **那么** 配置**必须**包含 `@crxjs/vite-plugin` 插件
- **并且** 插件**必须**引用 `manifest.json`

#### 场景：路径别名配置

- **当** 开发者在代码中使用 `@/` 前缀
- **那么** Vite **必须**正确解析到 `src/` 目录

- **当** 开发者在代码中使用 `@shared/` 前缀
- **那么** Vite **必须**正确解析到 `src/shared/` 目录

### 需求：Manifest V3 配置

项目**必须**有符合 Manifest V3 规范的 `manifest.json` 文件。

#### 场景：扩展基本信息

- **当** 开发者查看 `manifest.json`
- **那么** 文件**必须**包含：
  - `manifest_version`: 3
  - `name`: "CodeFrame"
  - `version`: "1.0.0"
  - `description`: 扩展描述

#### 场景：权限配置

- **当** 开发者查看权限配置
- **那么** `permissions` **必须**包含：
  - `activeTab` - 当前标签页访问
  - `storage` - 本地存储
  - `contextMenus` - 右键菜单
  - `clipboardWrite` - 剪贴板写入

#### 场景：页面入口配置

- **当** 开发者查看 `action` 配置
- **那么** **必须**定义 `default_popup` 指向 popup 页面

- **当** 开发者查看 `background` 配置
- **那么** **必须**定义 `service_worker` 指向 background 入口

#### 场景：内容脚本配置

- **当** 开发者查看 `content_scripts` 配置
- **那么** **必须**定义匹配规则和脚本入口
