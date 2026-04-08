# 国际化系统设计文档

## 上下文

CodeFrame 是一款 Chrome 浏览器插件，需要支持中文和英文两种界面语言。当前虽然已有语言设置选项，但缺少实际的国际化系统。

### 约束

- 使用 Chrome Extension Manifest V3
- 所有页面（popup、options、editor、codegen）和内容脚本都需要支持国际化
- 语言设置已通过 `chrome.storage.local` 持久化
- 需要轻量级方案，避免过度设计

### 利益相关者

- 开发者：需要简单的 API 来添加新翻译
- 用户：期望流畅的语言切换体验

---

## 目标 / 非目标

### 目标

- 实现完整的中英文国际化支持
- 语言切换后界面立即更新
- 支持所有用户可见的文字翻译
- 翻译文件易于维护和扩展

### 非目标

- 不支持超过 2 种语言（本次仅中文和英文）
- 不实现自动语言检测（用户手动选择）
- 不翻译开发者控制台日志
- 不翻译代码主题名称等专有名词

---

## 决策

### 技术选型：i18next + react-i18next

**理由：**
- 成熟稳定，React 生态最流行的 i18n 方案
- 支持 React 组件自动响应语言变化
- 支持命名空间，便于按模块组织翻译
- 支持插值、复数等高级特性
- 体积小（~40KB gzipped）

**替代方案：**

| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| Chrome i18n API | 原生支持，零依赖 | 需重启扩展才能生效，不支持动态切换 | ❌ 不满足需求 |
| 自建轻量方案 | 完全可控，体积最小 | 需要自己实现 React 响应机制 | ⚠️ 可行但开发成本高 |
| react-intl | 功能强大，FormatJS 生态 | 体积较大（~150KB），API 相对复杂 | ❌ 过度设计 |
| i18next | 平衡的体积和功能，生态完善 | - | ✅ 最佳选择 |

### 架构设计

```
src/shared/i18n/
├── index.ts              # i18n 初始化和导出
├── locales/              # 语言包目录
│   ├── zh-CN/           # 中文翻译
│   │   ├── common.json  # 通用翻译
│   │   ├── options.json # 设置页面翻译
│   │   ├── popup.json   # 弹窗翻译
│   │   ├── editor.json  # 编辑器翻译
│   │   └── codegen.json # 代码生成器翻译
│   └── en-US/           # 英文翻译
│       ├── common.json
│       ├── options.json
│       ├── popup.json
│       ├── editor.json
│       └── codegen.json
└── useLanguage.ts        # 语言切换 Hook
```

### 语言切换机制

1. 用户在设置页面选择语言
2. 设置自动保存到 `chrome.storage.local`
3. i18n 监听 storage 变化事件
4. 自动切换语言包并触发 React 重渲染

```typescript
// 语言变化监听示例
chrome.storage.onChanged.addListener((changes) => {
  if (changes.settings?.newValue?.language) {
    i18n.changeLanguage(changes.settings.newValue.language);
  }
});
```

---

## 风险 / 权衡

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 语言包体积增加 | 打包体积增加 ~20KB | 按命名空间懒加载，语言包仅加载当前语言 |
| 翻译遗漏 | 部分文字未翻译 | 实施阶段逐文件检查，使用 TypeScript 类型检查 |
| Content Script 国际化复杂 | Content Script 没有 React | 使用 i18next 核心 API（不使用 react-i18next） |
| 语言切换延迟 | 切换后可能有短暂延迟 | 使用异步加载优化，提供视觉反馈 |

---

## 迁移计划

### 阶段 1：基础框架搭建

1. 安装 i18next 和 react-i18next
2. 创建 i18n 初始化模块
3. 创建语言包文件结构
4. 实现语言切换监听机制

### 阶段 2：页面国际化

1. Options 页面国际化
2. Popup 页面国际化
3. Editor 页面国际化
4. CodeGen 页面国际化

### 阶段 3：Content Script 国际化

1. 遮罩层文字国际化
2. 倒计时提示国际化

### 阶段 4：测试和优化

1. 验证所有文字已翻译
2. 测试语言切换流程
3. 优化打包体积

### 回滚方案

如果出现严重问题，可以：
1. 保留语言设置功能但不实际切换
2. 移除 i18n 依赖，恢复硬编码中文
3. 删除语言包文件

---

## 待决问题

- [ ] 是否需要翻译错误提示信息？
- [ ] 语言切换时是否需要 toast 提示？
- [ ] 是否支持语言包热更新（未来扩展）？
