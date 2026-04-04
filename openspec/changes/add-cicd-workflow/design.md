## 上下文

CodeFrame 是一个 Chrome 扩展项目，当前通过 `pnpm build` 构建到 `dist` 目录。
用户需要手动打包 dist 目录才能安装扩展。项目托管在 GitHub，但缺乏自动化发布流程。

## 目标 / 非目标

**目标：**
- 标签推送时自动构建并生成 zip 压缩包
- 自动创建 GitHub Release 并附上构建产物
- 提供标准化的 Issue 和 PR 模板

**非目标：**
- Chrome Web Store 自动发布（需要 API 密钥和付费开发者账号）
- 多环境部署（dev/staging/production）
- 自动化测试流水线（本次仅关注构建和发布）

## 决策

### CI/CD 方案：GitHub Actions

**选择原因：**
- 与 GitHub 原生集成，无需额外服务
- 公开仓库免费无限制
- 支持标签触发、产物上传

**触发条件：**
- 推送 `v*` 格式标签（如 `v1.0.0`）

**构建产物命名：**
- `codeframe-{version}.zip`（如 `codeframe-1.0.0.zip`）

### Issue 模板格式：YAML 表单

**选择原因：**
- GitHub 原生支持 YAML 格式表单
- 结构化数据便于筛选和统计
- 用户体验优于纯 Markdown

**模板类型：**
1. Bug Report - 问题报告
2. Feature Request - 功能请求

### PR 模板格式：Markdown

**选择原因：**
- PR 内容自由度较高，Markdown 更灵活
- 支持任务清单勾选

## 风险 / 权衡

| 风险 | 缓解措施 |
|------|----------|
| 标签格式错误导致流水线失败 | 使用正则校验，文档说明格式规范 |
| 构建产物过大 | 压缩前清理不必要的文件（如 .map） |

## 待决问题

无
