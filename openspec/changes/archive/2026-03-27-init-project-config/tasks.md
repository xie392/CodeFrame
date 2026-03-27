## 1. 项目结构初始化

- [x] 1.1 创建 `src/` 目录结构
  - [x] 1.1.1 创建 `src/background/` 目录及入口文件
  - [x] 1.1.2 创建 `src/popup/` 目录及入口文件
  - [x] 1.1.3 创建 `src/editor/` 目录及入口文件
  - [x] 1.1.4 创建 `src/codegen/` 目录及入口文件
  - [x] 1.1.5 创建 `src/content/` 目录及入口文件
  - [x] 1.1.6 创建 `src/shared/` 目录（constants/types/utils/messages）
  - [x] 1.1.7 创建 `src/options/` 目录及入口文件
- [x] 1.2 创建 `public/` 目录结构
  - [x] 1.2.1 创建 `public/icons/` 目录
  - [x] 1.2.2 创建 `public/themes/` 目录

## 2. 构建配置

- [x] 2.1 初始化 `package.json`
  - [x] 2.1.1 定义项目基本信息
  - [x] 2.1.2 添加依赖（react, react-dom, vite, @crxjs/vite-plugin 等）
  - [x] 2.1.3 定义 scripts（dev/build/preview）
- [x] 2.2 创建 `vite.config.ts`
  - [x] 2.2.1 配置 CRXJS 插件
  - [x] 2.2.2 配置路径别名
  - [x] 2.2.3 配置构建选项
- [x] 2.3 创建 `manifest.json`
  - [x] 2.3.1 定义扩展基本信息
  - [x] 2.3.2 配置权限
  - [x] 2.3.3 配置入口页面
  - [x] 2.3.4 配置内容脚本
  - [x] 2.3.5 配置图标

## 3. TypeScript 配置

- [x] 3.1 创建 `tsconfig.json`
  - [x] 3.1.1 配置编译选项（target/module/strict）
  - [x] 3.1.2 配置路径别名
  - [x] 3.1.3 配置包含/排除文件
- [x] 3.2 创建 `tsconfig.node.json`（Vite 配置专用）
- [x] 3.3 创建类型声明文件
  - [x] 3.3.1 创建 `src/vite-env.d.ts`
  - [x] 3.3.2 创建 `src/types/global.d.ts`
  - [x] 3.3.3 创建 `src/types/chrome.d.ts`（扩展 API 类型）

## 4. 样式配置

- [x] 4.1 配置 TailwindCSS
  - [x] 4.1.1 创建 `tailwind.config.js`
  - [x] 4.1.2 创建 `postcss.config.js`
  - [x] 4.1.3 创建 `src/styles/globals.css`（TailwindCSS 入口）
- [x] 4.2 定义 CSS Variables 主题
  - [x] 4.2.1 定义颜色变量（背景/文字/强调色）
  - [x] 4.2.2 定义字体变量
  - [x] 4.2.3 定义间距变量
- [x] 4.3 配置字体
  - [x] 4.3.1 添加 JetBrains Mono 字体文件/CDN
  - [x] 4.3.2 添加 IBM Plex Mono 字体文件/CDN

## 5. 代码质量配置

- [x] 5.1 配置 ESLint
  - [x] 5.1.1 创建 `.eslintrc.cjs`
  - [x] 5.1.2 配置 TypeScript 规则
  - [x] 5.1.3 配置 React 规则
  - [x] 5.1.4 配置 Prettier 集成
- [x] 5.2 配置 Prettier
  - [x] 5.2.1 创建 `.prettierrc`
  - [x] 5.2.2 创建 `.prettierignore`
- [x] 5.3 配置 Git Hooks
  - [x] 5.3.1 初始化 husky
  - [x] 5.3.2 配置 pre-commit hook
  - [x] 5.3.3 配置 lint-staged
- [x] 5.4 创建 `.editorconfig`

## 6. Git 配置

- [x] 6.1 创建 `.gitignore`
- [x] 6.2 创建 `.gitattributes`

## 7. 其他配置文件

- [x] 7.1 创建 `.vscode/settings.json`（编辑器配置）
- [x] 7.2 创建 `.vscode/extensions.json`（推荐扩展）

## 8. 验证

- [x] 8.1 验证 `pnpm install` 安装依赖成功
- [x] 8.2 验证 `pnpm dev` 启动开发服务器成功
- [ ] 8.3 验证 `pnpm build` 构建成功
- [ ] 8.4 验证 TypeScript 类型检查通过
- [ ] 8.5 验证 ESLint 检查通过

---

**依赖关系说明：**
- 任务 1-6 可并行执行
- 任务 7 需要在 1-6 完成后执行
- 任务 8 需要在所有任务完成后执行

**预计工作量：** 2-3 小时
