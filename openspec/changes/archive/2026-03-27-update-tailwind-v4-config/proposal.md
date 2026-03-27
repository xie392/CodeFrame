# 变更：更新 Tailwind CSS v4 配置方式

## 为什么

当前项目使用了 Tailwind CSS v4，但配置方式仍保留了 v3 的 `tailwind.config.js` 文件。根据 Tailwind CSS v4 官方文档：

1. v4 采用 **CSS-first 配置**，不需要 `tailwind.config.js`
2. v4 内置了 `autoprefixer`，PostCSS 配置中无需额外添加
3. v4 提供 **零配置 content 检测**，自动扫描模板文件

当前配置存在冗余，增加了项目复杂度。

## 变更内容

### 当前配置（冗余）

```
├── tailwind.config.js        # v4 不需要
├── postcss.config.js         # 包含不必要的 autoprefixer
└── src/entrypoints/popup/style.css  # 正确使用 @import + @theme
```

### 目标配置

```
├── postcss.config.js         # 仅保留 @tailwindcss/postcss
└── src/entrypoints/popup/style.css  # CSS-first 配置（已有）
```

### 具体变更

1. **删除 `tailwind.config.js`** - v4 通过 CSS 的 `@theme` 指令配置
2. **简化 `postcss.config.js`** - 移除 `autoprefixer`（v4 已内置）

## 影响

- 受影响规范：无（纯配置变更，不影响功能）
- 受影响代码：
  - `tailwind.config.js`（删除）
  - `postcss.config.js`（简化）
- **重大变更**：无（向后兼容）
