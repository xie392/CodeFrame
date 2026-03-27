# 变更：重构项目目录结构

## 为什么

当前项目源码文件（`entrypoints/`, `components/`, `hooks/`, `stores/`, `utils/`, `assets/`）与配置文件混合在根目录，导致：

1. 根目录文件过多，可读性差
2. 源码与配置文件难以区分
3. 不符合常见的前端项目目录规范

## 变更内容

将项目源码移动到 `src/` 目录下，配置文件保持在根目录：

### 变更前后对比

```
变更前：                          变更后：
├── entrypoints/                  ├── src/
├── components/                   │   ├── entrypoints/
├── hooks/                        │   ├── components/
├── stores/                       │   ├── hooks/
├── utils/                        │   ├── stores/
├── assets/                       │   ├── utils/
├── public/                       │   └── assets/
├── env.d.ts                      │   └── env.d.ts
├── package.json                  ├── public/
├── tsconfig.json                 ├── package.json
├── wxt.config.ts                 ├── tsconfig.json
├── tailwind.config.js            ├── wxt.config.ts
└── ...                           ├── tailwind.config.js
                                  └── ...
```

### 具体变更

- **移动到 src/ 目录**：`entrypoints/`, `components/`, `hooks/`, `stores/`, `utils/`, `assets/`, `env.d.ts`
- **保持根目录**：`package.json`, `tsconfig.json`, `wxt.config.ts`, `tailwind.config.js`, `postcss.config.js`, `.gitignore`, `public/`, `openspec/`, `docs/`

### 配置更新

- 更新 `tsconfig.json` 的 `paths` 映射
- 更新 `tailwind.config.js` 的 `content` 路径
- 更新 `wxt.config.ts` 的 `srcDir` 配置

## 影响

- 受影响规范：无（项目结构变更不影响功能）
- 受影响代码：全部源码文件路径
- **重大变更**：所有 import 路径需要更新
