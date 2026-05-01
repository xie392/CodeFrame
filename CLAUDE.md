# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在本仓库中工作时提供指引。

## 项目概述

CodeFrame 是一款 Chrome 扩展（Manifest V3），集截图捕获、图片标注、代码美化为一体。技术栈：React 19 + TypeScript + Vite + CRXJS + Zustand + TailwindCSS。

## 常用命令

```bash
pnpm dev              # 启动开发服务器（Vite HMR，通过 CRXJS 支持）
pnpm build            # tsc && vite build → dist/
pnpm test             # Vitest 运行测试
pnpm test:watch       # Vitest 监听模式
pnpm test:coverage    # Vitest 生成覆盖率报告
pnpm test:e2e         # Playwright E2E 测试
pnpm lint             # ESLint 检查
pnpm lint:fix         # ESLint 自动修复
pnpm typecheck        # tsc --noEmit 类型检查
pnpm format           # Prettier 格式化
```

运行单个测试：`pnpm vitest run src/editor/hooks/__tests__/useZoomPan.test.ts`

## 架构

### 模块结构

`src/` 下每个目录是独立的功能模块。禁止跨模块直接导入内部实现——模块间通过 `shared/` 或 Chrome 消息通信。

```
src/
├── background/     # Service Worker — 消息路由、截图调度、存储管理
├── popup/          # 主弹窗入口（截图模式选择）
├── editor/         # 图片标注编辑器（箭头、矩形、文字、马赛克、裁剪）
├── codegen/        # 代码美化器（语法高亮、主题、渐变背景）
├── content/        # Content Scripts — 页面内截图捕获
├── shared/         # 共享模块 — UI 组件、状态、i18n、hooks、工具函数
└── options/        # 设置页面
```

### 编辑器渲染后端抽象

编辑器采用可插拔的渲染后端系统（`src/editor/backends/`）：

- **IRendererBackend** 接口（`backends/types.ts`）— 抽象图形 CRUD、视口、选中、裁剪
- **LeaferBackend**（`backends/leafer/leafer-backend.ts`）— 基于 LeaferJS 的渲染器（新方案，受 Feature Flag 控制）
- **Canvas2DCanvas**（`components/Canvas2DCanvas/`）— 旧版 Canvas 2D 渲染器
- **Feature Flag**（`backends/feature-flag.ts`）— Leafer 路径默认关闭；通过 URL 参数 `?leafer=true` 或 localStorage 键 `codeframe_use_leafer` 开启
- **Shape Adapters**（`backends/leafer/adapters/`）— Zustand store 数据与 Leafer 元素属性的双向映射
- **Bridges**（`backends/leafer/bridges/`）— React 与 Leafer 之间的选中、工具状态、视口同步

修改编辑器时，需确认改动影响哪个渲染路径。`useRendererBackend` hook 在运行时选择活跃后端。

### 状态管理

每个模块有一个 Zustand store，放在模块的 `store/` 目录下：
- `src/editor/store/editor-store.ts` — 图形、工具、选中、视口
- `src/shared/stores/settings-store.ts` — 用户偏好（持久化到 chrome.storage.local）
- `src/shared/stores/capture-store.ts` — 截图状态
- `src/codegen/stores/` — 代码生成器状态

Store 模式：状态按功能域分组，操作方法与状态放在一起，使用 `SetStateAction<T>` 支持函数式更新。

### Chrome 扩展通信

通过 `chrome.runtime.sendMessage` 消息驱动。类型安全的消息定义在 `src/shared/messages.ts`。Background service worker（`src/background/index.ts`）将消息路由到 `src/background/handlers/` 下的处理器（capture、desktop-capture、fullpage）。

Manifest V3 约束：禁止 `eval()`、内联脚本、远程代码加载。CSP：`script-src 'self'; object-src 'self'`。

## 代码规范

- **禁止 `any` 类型** — ESLint 强制（`@typescript-eslint/no-explicit-any: error`）
- **文件命名**：kebab-case（如 `editor-store.ts`）
- **组件目录**：PascalCase，含 `index.tsx`
- **Hooks**：`use` 前缀，单一职责
- **Stores**：`-store` 后缀
- **样式**：使用 `cn()`（来自 `@/shared/lib/utils`）合并 Tailwind 类名
- **设计系统**：深色终端主题，零圆角，无阴影，翡翠绿强调色（#10B981）
- **字体**：JetBrains Mono（标题/按钮）、IBM Plex Mono（正文）
- **单行长度**：≤ 80 字符
- **函数长度**：≤ 50 行
- **圈复杂度**：≤ 5
- **提交规范**：Conventional Commits（`feat(scope):`、`fix(scope):` 等）

## 测试

- 单元测试：Vitest，放在各模块的 `__tests__/` 目录下
- E2E 测试：Playwright（`e2e/*.spec.ts`）
- 覆盖率目标：≥ 60%
- 测试环境：happy-dom

## OpenSpec 工作流

新功能/重大变更必须先走 OpenSpec 提案流程：
1. `openspec-cn list --specs` — 查看现有规范
2. 在 `openspec/changes/<动词-名词>/` 下创建提案（如 `add-dark-theme-support`）
3. `openspec-cn validate <id> --strict` — 验证提案
4. 批准后实施，完成后归档

Bug 修复和小改动无需走此流程。

## 文档过时警示

以下文档类型可能包含未及时更新的过时信息，**一切以 `package.json` 和实际代码为准**：

- `.claude/rules/project.mdr` — 项目规范文档，可能落后于实际代码变更
- `openspec/project.md` — 项目上下文，可能落后于实际代码变更
- `openspec/changes/` 下的归档提案 — 记录的是历史状态，不代表当前技术栈
- `docs/` 下的设计文档 — 早期规划文档，可能已过时

**原则：代码 > 文档。遇到版本、技术栈等事实性信息，务必从 `package.json` 和源码中验证。**

## 提交前检查

Husky + lint-staged 会对暂存文件运行 ESLint 和 Prettier。推送前确认：
- `pnpm lint` 通过
- `pnpm test` 通过
- `pnpm build` 成功
