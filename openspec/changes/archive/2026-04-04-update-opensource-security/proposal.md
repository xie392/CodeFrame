# 变更：开源安全与合规优化

## 为什么

项目即将在 GitHub 开源，需要确保：
1. 无隐私信息泄露风险
2. 依赖漏洞已修复
3. 开源必备文件齐全
4. 安全策略明确

## 变更内容

### 安全修复
- 更新 `vite` 修复 esbuild CORS 漏洞（CVE-2024-34342）
- 更新 `@crxjs/vite-plugin` 修复 Rollup 路径遍历漏洞（CVE-2024-47068）

### 文件补充
- 添加 `CONTRIBUTING.md` 贡献指南
- 添加 `SECURITY.md` 安全策略
- 添加 `.github/dependabot.yml` 自动依赖更新
- 更新 `LICENSE` 年份（2024 → 2026）

### CI/CD 增强
- 在 CI 中添加 `pnpm audit` 安全检查

## 影响

- 受影响规范：`cicd`
- 受影响代码：
  - `package.json`（依赖版本）
  - `.github/workflows/`（CI 配置）
  - 根目录新增文件
