## 1. 创建 GitHub 工作流配置

- [x] 1.1 创建 `.github/workflows/release.yml` 发布工作流
  - 配置触发条件：推送 v* 标签
  - 配置构建步骤：安装依赖、构建项目
  - 配置打包步骤：将 dist 目录打包为 zip
  - 配置发布步骤：创建 GitHub Release 并上传产物

## 2. 创建 Issue 模板

- [x] 2.1 创建 `.github/ISSUE_TEMPLATE/bug_report.yml` Bug 报告模板
  - 包含问题描述、复现步骤、期望行为、实际行为
  - 包含环境信息收集（浏览器版本、操作系统）

- [x] 2.2 创建 `.github/ISSUE_TEMPLATE/feature_request.yml` 功能请求模板
  - 包含功能描述、使用场景、期望解决方案

- [x] 2.3 创建 `.github/ISSUE_TEMPLATE/config.yml` 模板配置
  - 配置空白 Issue 禁用提示

## 3. 创建 PR 模板

- [x] 3.1 创建 `.github/PULL_REQUEST_TEMPLATE.md` PR 模板
  - 包含变更描述、测试清单、截图对比（如适用）

## 4. 验证

- [ ] 4.1 提交变更并验证工作流语法
- [ ] 4.2 创建测试标签验证流水线执行
