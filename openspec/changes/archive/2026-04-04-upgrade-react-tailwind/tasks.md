## 1. 准备工作
- [x] 1.1 创建迁移分支 `upgrade-react-tailwind`
- [ ] 1.2 关闭 Dependabot 相关 PR (#4, #6, #7, #8)

## 2. React 19 升级
- [x] 2.1 更新 package.json 中的 React 相关依赖版本
- [x] 2.2 安装新依赖
- [x] 2.3 修复 src/codegen/App.tsx 中的 RefObject 类型错误
- [x] 2.4 修复 src/editor/App.tsx 中的 RefObject 类型错误
- [x] 2.5 修复 src/editor/hooks/useTextEditing.ts 中的类型错误
- [x] 2.6 修复 src/codegen/hooks/__tests__/useExport.test.ts 中的类型错误
- [x] 2.7 运行 typecheck 验证

## 3. Tailwind v4 迁移
- [x] 3.1 安装 @tailwindcss/postcss 包
- [x] 3.2 更新 postcss.config.js 配置
- [x] 3.3 将 tailwind.config.js 配置迁移到 CSS
- [x] 3.4 更新 src/styles/globals.css 中的 Tailwind 导入
- [x] 3.5 删除 tailwind.config.js
- [x] 3.6 构建验证

## 4. @types/chrome 升级
- [x] 4.1 更新 @types/chrome 到 0.1.39
- [x] 4.2 修复 src/background/handlers/desktop-capture.ts 类型错误
- [x] 4.3 修复 src/shared/i18n/content.ts 类型错误
- [x] 4.4 修复 src/shared/i18n/index.ts 类型错误
- [x] 4.5 修复 src/shared/stores/capture-store.ts 类型错误

## 5. ESLint 插件升级
- [x] 5.1 更新 eslint-plugin-react-hooks 到 7.0.1
- [x] 5.2 更新 eslint-plugin-react-refresh 到 0.4.19（保持 eslint 8 兼容）
- [x] 5.3 重命名 useCurrent 为 useCurrentRef
- [x] 5.4 重命名 useSyncedRef 变量以符合规则
- [x] 5.5 修复 useEditorInit.ts 中的 refs 规则错误
- [x] 5.6 运行 lint 验证

## 6. 测试与验证
- [x] 6.1 运行 pnpm typecheck
- [x] 6.2 运行 pnpm lint
- [x] 6.3 运行 pnpm test
- [x] 6.4 运行 pnpm build
- [x] 6.5 手动测试截图功能
- [x] 6.6 手动测试代码美化功能
- [x] 6.7 手动测试图片编辑功能

## 7. 发布
- [x] 7.1 提交代码变更
- [x] 7.2 合并到 dev 分支（fast-forward）
- [ ] 7.3 更新版本号到 1.1.0
- [ ] 7.4 打 tag v1.1.0
- [ ] 7.5 推送到远程
