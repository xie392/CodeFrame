## 上下文

CodeFrame 是一个 Chrome 扩展项目，需要选择合适的技术栈来支持：
- Manifest V3 扩展规范
- 多页面架构（popup/editor/codegen/options）
- 内容脚本注入
- 本地存储和 IndexedDB

## 目标 / 非目标

**目标：**
- 建立可扩展的项目结构
- 配置高效的开发体验（HMR、类型检查）
- 确保代码质量和一致性

**非目标：**
- 实现具体功能代码
- 配置测试框架（后续变更处理）
- 配置 CI/CD（后续变更处理）

## 决策

### 构建工具选型

| 决策 | 选择 CRXJS + Vite |
|------|-------------------|
| 理由 | 1. 原生支持 Chrome 扩展 HMR，开发体验极佳<br>2. 基于 Vite，构建速度快<br>3. 自动处理 Manifest V3 配置<br>4. 社区活跃，文档完善 |
| 备选 | Webpack + chrome-extension-manifest |

### 目录结构设计

```
codeframe/
├── src/
│   ├── background/      # Service Worker
│   ├── popup/           # 主弹窗
│   ├── editor/          # 图片编辑器
│   ├── codegen/         # 代码生成器
│   ├── content/         # 内容脚本
│   ├── shared/          # 共享模块
│   └── options/         # 设置页
├── public/
│   ├── icons/           # 扩展图标
│   └── themes/          # 预设主题
└── *.config.ts          # 配置文件
```

**设计原则：**
- 按功能模块划分，职责清晰
- shared 模块避免代码重复
- 支持 Tree Shaking

### TypeScript 配置

```typescript
// 核心配置
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```

### 样式方案

| 决策 | 选择 TailwindCSS + CSS Variables |
|------|-----------------------------------|
| 理由 | 1. TailwindCSS 快速开发<br>2. CSS Variables 支持主题切换<br>3. 符合 Terminal Minimal 设计风格 |

**主题变量定义：**
```css
:root {
  --color-bg-primary: #0A0A0A;
  --color-accent: #10B981;
  --font-primary: 'JetBrains Mono';
  --font-secondary: 'IBM Plex Mono';
}
```

### 代码质量工具

| 工具 | 用途 | 配置要点 |
|------|------|----------|
| ESLint | 代码检查 | TypeScript 严格规则、React Hooks 规则 |
| Prettier | 代码格式化 | 单行 80 字符、无分号、单引号 |
| husky | Git Hooks | pre-commit 执行 lint-staged |
| lint-staged | 暂存检查 | 只检查暂存文件 |

## 风险 / 权衡

| 风险 | 缓解措施 |
|------|----------|
| CRXJS 依赖更新不及时 | 关注 GitHub Issues，必要时可切换到纯 Vite 配置 |
| Shiki 包体积大 | 使用 Web Worker 加载，按需加载语言包 |
| TailwindCSS 与 CSS Variables 配合 | 使用 `@apply` 封装主题类 |

## 依赖关系

```
项目初始化（当前）
    ↓
功能开发（后续）
    ├── 截图功能
    ├── 标注功能
    └── 代码美化功能
```

## 待决问题

- [ ] 是否需要配置路径别名（@/*）？（建议：是，提升开发体验）
- [ ] 是否需要配置测试框架？（建议：后续单独变更处理）
