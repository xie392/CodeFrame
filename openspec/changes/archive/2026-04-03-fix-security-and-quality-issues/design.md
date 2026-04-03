## 上下文

代码审查发现了多个安全和质量问题需要修复。这些问题涉及截图处理、存储数据验证和日志管理。

### 约束

- 保持向后兼容，不改变现有 API 接口
- 不影响截图功能的正常行为
- 所有修改必须在 Service Worker 环境下工作

### 利益相关者

- 开发者：代码可维护性提升
- 用户：扩展稳定性提升

---

## 目标 / 非目标

### 目标

- 修复 atob 解码错误处理，防止扩展崩溃
- 添加存储数据类型验证，防止恶意数据注入
- 移除生产环境调试日志，防止敏感信息泄露
- 抽取重复代码，提升可维护性
- 确保 ImageBitmap 资源正确释放，防止内存泄漏

### 非目标

- 不重构 Editor 组件（单独处理）
- 不添加单元测试（单独处理）
- 不修改马赛克绘制逻辑（单独处理）

---

## 决策

### 决策 1：创建共享图像处理模块

**选择方案**：在 `src/background/handlers/utils/image.ts` 创建共享模块

**理由**：
- `capture.ts` 和 `fullpage.ts` 都需要图像处理功能
- 统一的错误处理更容易维护
- 集中管理资源释放逻辑

```typescript
// src/background/handlers/utils/image.ts
export async function dataUrlToBitmap(dataUrl: string): Promise<ImageBitmap> {
  const base64 = dataUrl.split(',')[1];
  if (!base64) throw new Error('无效的 data URL');
  
  let binaryStr: string;
  try {
    binaryStr = atob(base64);
  } catch (e) {
    throw new Error('无效的 base64 数据');
  }
  
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  
  return createImageBitmap(new Blob([bytes], { type: 'image/png' }));
}
```

### 决策 2：创建日志工具

**选择方案**：使用环境变量控制日志输出

**理由**：
- Vite 构建时 `process.env.NODE_ENV` 会被替换
- 简单直接，无需额外配置

```typescript
// src/shared/utils/logger.ts
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => isDev && console.log('[CodeFrame]', ...args),
  error: (...args: unknown[]) => console.error('[CodeFrame]', ...args),
  warn: (...args: unknown[]) => console.warn('[CodeFrame]', ...args),
};
```

### 决策 3：存储数据类型验证

**选择方案**：使用类型守卫验证语言设置

**理由**：
- 仅接受预定义的语言值
- 防止恶意数据注入
- 保持默认值逻辑

```typescript
function isValidLanguage(value: unknown): value is 'zh-CN' | 'en-US' {
  return value === 'zh-CN' || value === 'en-US';
}

async function getSavedLanguage(): Promise<string> {
  try {
    const result = await chrome.storage.local.get('codeframe_settings');
    const settings = result?.codeframe_settings?.state?.settings;
    if (settings && isValidLanguage(settings.language)) {
      return settings.language;
    }
    return 'zh-CN';
  } catch {
    return 'zh-CN';
  }
}
```

### 考虑的替代方案

1. **Zod 验证库**：对于简单的类型验证来说过于重量级
2. **全局错误边界**：Chrome 扩展的 Service Worker 不支持全局错误捕获

---

## 风险 / 权衡

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 共享模块导入可能影响构建 | 低 | 使用相对路径导入，确保 Vite 正确解析 |
| 日志工具可能遗漏部分 console 调用 | 低 | 使用 grep 搜索所有 console.log 调用 |

---

## 迁移计划

1. 创建共享模块（不影响现有代码）
2. 重构 `fullpage.ts` 使用共享模块
3. 重构 `capture.ts` 使用共享模块
4. 替换日志调用
5. 添加类型验证
6. 验证构建和功能

**回滚方案**：每个文件独立修改，如有问题可单独回滚

---

## 待决问题

- 无
