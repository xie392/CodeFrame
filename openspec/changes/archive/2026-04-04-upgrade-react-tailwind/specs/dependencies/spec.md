## 新增需求

### 需求：依赖版本规范

项目必须使用以下主要依赖版本：

| 依赖 | 版本要求 |
|------|----------|
| React | ^19.0.0 |
| React DOM | ^19.0.0 |
| Tailwind CSS | ^4.0.0 |
| @tailwindcss/postcss | ^4.0.0 |

#### 场景：依赖安装成功

- **当** 执行 pnpm install
- **那么** 所有依赖成功安装
- **且** 无安全警告

#### 场景：构建成功

- **当** 执行 pnpm build
- **那么** 构建成功完成
- **且** 输出文件在 dist 目录

---

### 需求：Tailwind CSS v4 配置

项目必须使用 CSS-first 配置方式配置 Tailwind CSS。

#### 场景：CSS 配置正确

- **当** 查看 src/styles/globals.css
- **那么** 包含 @import "tailwindcss"
- **且** 主题配置使用 @theme 指令

#### 场景：PostCSS 配置正确

- **当** 查看 postcss.config.js
- **那么** 使用 @tailwindcss/postcss 插件
- **且** 无 tailwindcss 直接引用
