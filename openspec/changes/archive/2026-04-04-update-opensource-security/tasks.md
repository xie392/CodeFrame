## 1. 依赖安全更新

- [x] 1.1 更新 vite 到安全版本（修复 esbuild CORS 漏洞）
- [x] 1.2 更新 @crxjs/vite-plugin（修复 Rollup 路径遍历漏洞）
- [x] 1.3 运行 `pnpm audit` 确认无已知漏洞
- [x] 1.4 运行 `pnpm build` 确认构建正常
- [x] 1.5 运行 `pnpm test` 确认测试通过

## 2. 开源文件补充

- [x] 2.1 创建 `CONTRIBUTING.md` 贡献指南
- [x] 2.2 创建 `SECURITY.md` 安全策略
- [x] 2.3 更新 `LICENSE` 年份为 2026
- [x] 2.4 创建 `.github/dependabot.yml` 自动依赖更新配置

## 3. CI/CD 安全增强

- [x] 3.1 在 CI 工作流中添加 `pnpm audit` 检查步骤
- [x] 3.2 验证 CI 流程正常运行

## 4. 验证

- [x] 4.1 运行 `openspec-cn validate update-opensource-security --strict`
- [x] 4.2 确认所有文件格式正确
