# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- 初始项目结构和核心组件
- 截图功能（区域截图、可视区域截图、整页截图、桌面截图）
- 代码生成器（CodeMirror 编辑器 + Shiki 高亮）
- 图片编辑器（标注、马赛克、裁剪）
- 设置页面

### Security

- 添加消息来源验证，防止恶意消息攻击
- 重构选区 UI，使用 DOM API 替代 innerHTML，防止 XSS 攻击
- 添加敏感数据过期清理机制
- 更新 vitest 到 1.6.1+ 修复 CVE-2025-24964

### Fixed

- 修复 TypeScript any 类型问题
- 修复模块导入规范问题
- 修复 `restoreFromHistory` 函数的多次赋值覆盖 bug

### Tests

- 测试覆盖率 60.24%，562 个测试用例
