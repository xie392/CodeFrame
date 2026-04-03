## 1. 安全修复

- [x] 1.1 创建 `src/background/handlers/utils/image.ts` 共享模块
  - [x] 1.1.1 实现 `dataUrlToBitmap()` 函数（带 atob 错误处理）
  - [x] 1.1.2 实现 `blobToDataUrl()` 函数
  - [x] 1.1.3 实现 `scaleImage()` 函数（带 try-finally 资源释放）

- [x] 1.2 创建 `src/shared/utils/logger.ts` 日志工具
  - [x] 1.2.1 实现开发环境启用、生产环境禁用的日志函数
  - [x] 1.2.2 替换 `src/background/index.ts` 中的 console.log 调用

- [x] 1.3 修复 `src/shared/i18n/index.ts` 类型验证
  - [x] 1.3.1 添加 language 字段的类型验证（仅接受 'zh-CN' 或 'en-US'）

- [x] 1.4 修复 `src/shared/i18n/content.ts` 类型验证
  - [x] 1.4.1 添加 language 字段的类型验证（仅接受 'zh-CN' 或 'en-US'）

## 2. 代码重构

- [x] 2.1 重构 `src/background/handlers/capture.ts`
  - [x] 2.1.1 移除重复代码，导入共享模块
  - [x] 2.1.2 使用 try-finally 确保 ImageBitmap 资源释放

- [x] 2.2 重构 `src/background/handlers/fullpage.ts`
  - [x] 2.2.1 移除重复代码，导入共享模块
  - [x] 2.2.2 使用 try-finally 确保 ImageBitmap 资源释放

## 3. 验证

- [x] 3.1 运行构建验证（`pnpm build`）
- [ ] 3.2 验证截图功能正常工作
  - [ ] 3.2.1 可视区域截图
  - [ ] 3.2.2 区域截图
  - [ ] 3.2.3 整页截图

## 依赖关系

- 任务 1.1 是任务 2.1 和 2.2 的前置依赖
- 任务 1.2、1.3、1.4 可以并行执行
- 任务 3.x 必须在所有修复完成后执行
