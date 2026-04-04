# 贡献指南

感谢你考虑为 CodeFrame 做贡献！

## 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境](#开发环境)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)

---

## 行为准则

请阅读并遵守我们的行为准则，确保项目社区对所有人友好开放。

---

## 如何贡献

### 报告 Bug

如果你发现了 Bug，请通过 [GitHub Issues](https://github.com/xie392/CodeFrame/issues) 提交报告。

提交前请：
1. 搜索现有 Issues，确认没有重复
2. 使用 Bug 报告模板
3. 提供清晰的复现步骤

### 提出新功能

欢迎提出新功能建议！请：
1. 通过 Issues 描述你的想法
2. 说明使用场景和预期效果
3. 等待讨论和反馈

### 提交代码

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 开发环境

### 前置要求

- Node.js 18+
- pnpm 8+

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/xie392/CodeFrame.git
cd CodeFrame

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 可用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm test` | 运行测试 |
| `pnpm test:coverage` | 运行测试并生成覆盖率报告 |
| `pnpm lint` | 代码检查 |
| `pnpm typecheck` | 类型检查 |

### 加载扩展到 Chrome

1. 运行 `pnpm build` 生成 `dist` 目录
2. 打开 Chrome，访问 `chrome://extensions/`
3. 启用「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择项目的 `dist` 目录

---

## 代码规范

### 命名约定

| 类型 | 规范 | 示例 |
|------|------|------|
| 变量/函数 | camelCase | `getUserById` |
| 常量 | UPPER_SNAKE_CASE | `MAX_COUNT` |
| 组件/类型 | PascalCase | `Button` |
| 文件名 | kebab-case | `user-card.tsx` |

### 代码约束

- 单行长度 ≤ 80 字符
- 圈复杂度 ≤ 5
- 函数长度 ≤ 50 行
- 禁止 `any` 类型
- 纯函数优先
- 早返回，避免嵌套

### 代码风格

项目使用 ESLint + Prettier 保持代码风格一致：

```bash
# 检查代码
pnpm lint

# 自动修复
pnpm lint:fix

# 格式化代码
pnpm format
```

---

## 提交规范

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型（type）

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构 |
| `test` | 测试相关 |
| `chore` | 构建/工具相关 |

### 示例

```bash
feat(editor): 添加箭头标注工具
fix(screenshot): 修复区域截图偏移问题
docs: 更新安装文档
```

---

## Pull Request 流程

### 提交前检查清单

- [ ] 代码通过 `pnpm lint` 检查
- [ ] 代码通过 `pnpm typecheck` 类型检查
- [ ] 所有测试通过 `pnpm test`
- [ ] 新功能有对应测试
- [ ] 提交信息符合规范

### PR 标题

使用与提交信息相同的格式：

```
feat(scope): 简短描述
```

### 审核流程

1. 自动检查（CI）通过
2. 至少一位维护者审核
3. 合并到 `dev` 分支

---

## 项目结构

```
src/
├── background/     # Service Worker（扩展后台）
├── popup/          # 弹出窗口（主入口）
├── editor/         # 图片标注编辑器
├── codegen/        # 代码美化生成器
├── content/        # Content Scripts
├── options/        # 设置页面
├── shared/         # 共享模块
│   ├── components/ # 公共组件
│   ├── hooks/      # 公共 Hooks
│   ├── stores/     # 公共状态
│   └── utils/      # 工具函数
└── types/          # 类型定义
```

---

## 需要帮助？

如果你有任何问题，可以：

- 在 [Discussions](https://github.com/xie392/CodeFrame/discussions) 发起讨论
- 在 Issue 中提问

感谢你的贡献！
