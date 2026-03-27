## 上下文

项目使用 Tailwind CSS v4，但配置方式混合了 v3 和 v4 的做法：
- CSS 文件已正确使用 `@import "tailwindcss"` + `@theme` 指令
- 但仍保留了 v3 风格的 `tailwind.config.js`
- PostCSS 配置中添加了不必要的 `autoprefixer`

## 目标 / 非目标

- 目标：简化配置，完全采用 Tailwind CSS v4 的 CSS-first 方式
- 非目标：改变任何样式行为或设计令牌

## 决策

### 删除 tailwind.config.js

**原因**：Tailwind CSS v4 采用 CSS-first 配置，所有设计令牌通过 CSS 的 `@theme` 指令定义。

**迁移方式**：
- 当前 `tailwind.config.js` 中定义的颜色、字体等已在 `style.css` 的 `@theme` 块中定义
- content 路径在 v4 中自动检测，无需配置

### 移除 autoprefixer

**原因**：Tailwind CSS v4 已内置 autoprefixer 功能。

**官方文档说明**：
> This JavaScript snippet demonstrates how to modify your `postcss.config.mjs` file for Tailwind CSS v4. It shows replacing the `tailwindcss` plugin with `@tailwindcss/postcss` and removing `postcss-import` and `autoprefixer` as their functionalities are now integrated into v4.

## 风险 / 权衡

| 风险 | 缓解措施 |
|------|----------|
| 自动 content 检测遗漏文件 | v4 的启发式检测覆盖常见模式，如有问题可通过 `@source` 指令明确指定 |

## 迁移计划

1. 删除 `tailwind.config.js`
2. 更新 `postcss.config.js` 移除 `autoprefixer`
3. 运行构建验证

## 参考文档

- [Tailwind CSS v4 CSS-first Configuration](https://tailwindcss.com/blog/tailwindcss-v4#css-first-configuration)
- [Tailwind CSS v4 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
