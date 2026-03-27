# build-configuration Specification

## Purpose
TBD - created by archiving change update-tailwind-v4-config. Update Purpose after archive.
## 需求
### 需求：Tailwind CSS v4 CSS-first 配置

项目必须使用 Tailwind CSS v4 的 CSS-first 配置方式，不使用 `tailwind.config.js` 文件。

#### 场景：CSS 文件配置设计令牌

- **当** 开发者需要自定义主题颜色、字体等设计令牌
- **那么** 必须在 CSS 文件中使用 `@theme` 指令定义

#### 场景：PostCSS 配置

- **当** 配置 PostCSS 处理 CSS
- **那么** 只需要 `@tailwindcss/postcss` 插件，不需要额外的 `autoprefixer`

