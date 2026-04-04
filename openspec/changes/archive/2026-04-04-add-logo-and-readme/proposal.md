# 变更：为项目添加 Logo 和 README 文件

## 为什么

项目 MVP 版本已基本完成，准备在 GitHub 开源。当前项目存在以下问题：
1. 缺少专业的 Logo 设计，现有图标为简单的 "CF" 占位符
2. 缺少 README.md 文件，不利于用户了解项目功能和使用方式

开源项目需要专业的品牌形象和完善的文档来吸引潜在用户和贡献者。

## 变更内容

### 1. Logo 设计
- 使用豆包生图 API 生成专业的项目 Logo
- Logo 设计方向：
  - 融合「代码」和「相框/截图」元素
  - 符合项目终端极简风格（Terminal Minimal）
  - 主色调使用翡翠绿 (#10B981)
- 生成多种尺寸图标：
  - `icon16.png` - 浏览器工具栏小图标
  - `icon48.png` - 扩展管理页面图标
  - `icon128.png` - Chrome 商店展示图标
  - `logo.svg` - 矢量版本（README 使用）
  - `logo.png` - 高清版本（README 使用）

### 2. README.md 文件
创建完整的项目 README，包含以下内容：
- 项目名称和简介
- 功能特性展示
- 安装指南
- 使用说明
- 技术栈介绍
- 开发指南
- 贡献指南
- 许可证信息
- 致谢

## 影响

- 受影响规范：新增 `branding` 规范
- 受影响文件：
  - `public/icons/` - 替换现有图标
  - `README.md` - 新增文件
  - `public/logo.svg` - 新增文件
  - `public/logo.png` - 新增文件
