# 实施任务清单

## 1. 创建目录结构

- [x] 1.1 创建 `src/` 目录
- [x] 1.2 移动 `entrypoints/` 到 `src/entrypoints/`
- [x] 1.3 移动 `components/` 到 `src/components/`
- [x] 1.4 移动 `hooks/` 到 `src/hooks/`
- [x] 1.5 移动 `stores/` 到 `src/stores/`
- [x] 1.6 移动 `utils/` 到 `src/utils/`
- [x] 1.7 移动 `assets/` 到 `src/assets/`
- [x] 1.8 移动 `env.d.ts` 到 `src/env.d.ts`

## 2. 更新配置文件

- [x] 2.1 更新 `wxt.config.ts` 添加 `srcDir: 'src'`
- [x] 2.2 更新 `tsconfig.json` 的 `include` 路径
- [x] 2.3 更新 `tailwind.config.js` 的 `content` 路径

## 3. 验证构建

- [x] 3.1 运行 `pnpm dev` 验证开发模式
- [x] 3.2 运行 `pnpm build` 验证生产构建
- [x] 3.3 确认扩展功能正常
