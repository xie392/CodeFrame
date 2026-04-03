# 变更：修复安全问题和代码质量问题

## 为什么

代码审查发现了多个需要修复的问题：

1. **安全问题（P0）**：`atob()` 解码缺少错误处理，可能导致后台脚本崩溃
2. **安全问题（P0）**：`chrome.storage` 数据读取缺少类型验证，可能导致运行时错误
3. **安全问题（P1）**：生产代码中保留了 `console.log` 语句，可能泄露敏感信息
4. **代码质量（P2）**：`capture.ts` 和 `fullpage.ts` 存在大量重复代码，违反 DRY 原则
5. **性能问题（P2）**：`ImageBitmap` 资源在部分错误路径未正确释放

## 变更内容

### 1. 安全修复

- 添加 `atob()` 解码的错误处理，捕获无效 base64 数据异常
- 添加 `chrome.storage` 数据读取的类型验证
- 创建统一的日志工具，在生产环境禁用调试日志

### 2. 代码重构

- 抽取 `capture.ts` 和 `fullpage.ts` 的共享代码到 `src/background/handlers/utils/` 目录
- 使用 `try-finally` 确保 `ImageBitmap` 资源正确释放

## 影响

- 受影响规范：screenshot
- 受影响代码：
  - `src/background/handlers/capture.ts`
  - `src/background/handlers/fullpage.ts`
  - `src/background/index.ts`
  - `src/shared/i18n/index.ts`
  - `src/shared/i18n/content.ts`
