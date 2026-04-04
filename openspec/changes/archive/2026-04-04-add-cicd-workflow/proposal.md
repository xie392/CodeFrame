# 变更：添加 CI/CD 流水线和 GitHub 协作模板

## 为什么

项目目前缺乏自动化构建和发布流程，每次发布需要手动打包。同时缺少标准化的 Issue 和 PR 模板，
影响协作效率和问题追踪质量。

## 变更内容

### CI/CD 流水线
- 添加 GitHub Actions 工作流，监听标签推送自动触发构建
- 自动打包扩展为 zip 压缩包
- 构建产物自动发布到 GitHub Releases

### 协作模板
- 添加 Bug Report Issue 模板
- 添加 Feature Request Issue 模板
- 添加 Pull Request 模板

## 影响

- 受影响规范：新增 `cicd` 规范
- 新增文件：
  - `.github/workflows/release.yml` - 发布工作流
  - `.github/ISSUE_TEMPLATE/bug_report.yml` - Bug 报告模板
  - `.github/ISSUE_TEMPLATE/feature_request.yml` - 功能请求模板
  - `.github/PULL_REQUEST_TEMPLATE.md` - PR 模板
