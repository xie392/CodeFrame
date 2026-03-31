# 变更：修复 codegen 页面水印开启后不显示的问题

## 为什么
水印功能在归档变更 `enhance-codegen-themes-and-backgrounds` 中已实现，但当前版本水印开启后无法显示。经排查，水印渲染使用了 SVG data URL 作为 `backgroundImage`，其中 `font-family` 和 `fill` 属性值包含未编码的特殊字符（单引号、逗号、括号），导致整个 data URL 解析失败，`backgroundImage` 为空。

## 变更内容
- 对水印 SVG data URL 中的所有动态值（`font-family`、`fill` 颜色值）统一使用 `encodeURIComponent` 编码
- 当前仅 `watermarkText` 做了编码，`font-family`（如 `"'JetBrains Mono', monospace"`）和 `fill`（如 `rgba(255,255,255,0.12)`）均未编码

## 影响
- 受影响规范：`codegen`
- 受影响代码：`src/codegen/App.tsx:1107-1113`（水印渲染的 `backgroundImage` 样式）
