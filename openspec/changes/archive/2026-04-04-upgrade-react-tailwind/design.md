## 上下文

CodeFrame 当前使用 React 18.3.1 和 Tailwind CSS 3.4.x，Dependabot 检测到有新版本可用。
React 19 和 Tailwind v4 都是大版本更新，带来破坏性变更。

### 当前版本
- React: 18.3.1
- React DOM: 18.3.1
- Tailwind CSS: 3.4.x
- @types/chrome: 0.0.263
- eslint-plugin-react-hooks: 4.6.0

### 目标版本
- React: 19.2.x
- React DOM: 19.2.x
- Tailwind CSS: 4.2.x
- @types/chrome: 0.1.39
- eslint-plugin-react-hooks: 7.0.1

## 目标 / 非目标

### 目标
- 升级到 React 19，获得最新特性和性能改进
- 升级到 Tailwind v4，使用新的配置系统和更快的构建
- 修复所有类型错误和 ESLint 错误
- 保持现有功能不变

### 非目标
- 重构现有组件架构
- 添加新功能

## 决策

### React 19 升级策略

**决策**: 直接升级，修复类型错误

**原因**:
- React 19 向后兼容性良好
- 主要变更是 RefObject 类型更严格
- 类型错误可通过类型断言或类型声明修复

**修复方案**:
```typescript
// 旧代码
const ref = useRef<HTMLDivElement>(null);
// ref 类型为 RefObject<HTMLDivElement | null>

// React 19 需要显式声明
const ref = useRef<HTMLDivElement | null>(null);
```

### Tailwind v4 迁移策略

**决策**: 使用新的 CSS-first 配置方式

**原因**:
- Tailwind v4 废弃 tailwind.config.js
- 改用 CSS 变量和 @import 方式配置
- PostCSS 插件移到 @tailwindcss/postcss

**迁移步骤**:
1. 安装 @tailwindcss/postcss
2. 更新 postcss.config.js
3. 在 CSS 文件中配置主题
4. 移除 tailwind.config.js

### eslint-plugin-react-hooks 升级策略

**决策**: 升级并修复代码

**原因**:
- 新规则帮助发现潜在问题
- 主要问题是 refs 在渲染期间被修改

**修复方案**:
```typescript
// 问题代码：在渲染期间修改 ref
function useCurrent<T>(value: T) {
  const ref = useRef(value);
  ref.current = value; // ❌ 新规则禁止
  return ref;
}

// 解决方案：重命名为 *Ref 后缀
function useCurrentRef<T>(value: T) {
  const ref = useRef(value);
  ref.current = value; // ✅ 允许修改 *Ref 后缀变量
  return ref;
}
```

### @types/chrome 升级策略

**决策**: 升级并修复类型错误

**原因**:
- 新版本类型定义更准确
- 主要变更是 MediaStreamConstraint 类型

**修复方案**:
```typescript
// 使用类型断言
const sources = ['screen', 'window'] as ('screen' | 'window')[];
```

## 风险 / 权衡

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 构建失败 | 高 | 高 | 分步骤迁移，每步验证 |
| 运行时错误 | 中 | 高 | 完整测试覆盖 |
| 样式丢失 | 中 | 中 | Tailwind 迁移后全面检查 UI |
| 回归问题 | 低 | 高 | 运行完整测试套件 |

## 迁移计划

### 阶段 1: 准备工作
1. 创建新分支 `upgrade-react-tailwind`
2. 关闭 Dependabot 相关 PR

### 阶段 2: React 19 升级
1. 更新 package.json 依赖版本
2. 安装依赖
3. 修复类型错误
4. 运行测试验证

### 阶段 3: Tailwind v4 迁移
1. 安装 @tailwindcss/postcss
2. 更新 postcss.config.js
3. 迁移配置到 CSS
4. 删除 tailwind.config.js
5. 构建验证

### 阶段 4: 其他依赖更新
1. 更新 @types/chrome
2. 更新 eslint-plugin-react-hooks
3. 更新 eslint-plugin-react-refresh
4. 修复 ESLint 错误

### 阶段 5: 验证与发布
1. 运行完整测试套件
2. 手动测试所有功能
3. 构建生产版本
4. 合并到 main

## 回滚计划

如果迁移失败：
1. 恢复 package.json 和 pnpm-lock.yaml
2. 恢复 tailwind.config.js 和 postcss.config.js
3. 恢复代码变更
4. 重新安装依赖

## 待决问题

- [ ] Tailwind v4 是否支持所有当前使用的类名？
- [ ] React 19 是否有其他隐藏的破坏性变更？
