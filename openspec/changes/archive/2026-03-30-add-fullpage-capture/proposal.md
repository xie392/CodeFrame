# 变更：实现整页截图功能

## 为什么

整页截图是 CodeFrame 截图模块的三大核心功能之一（区域截图、可视区域截图、整页截图）。根据产品需求文档 CAP-003，整页截图功能优先级为 P0，是 MVP 版本的必备功能。

当前项目已实现：
- 可视区域截图（CAPTURE_REQUEST mode: 'visible'）
- 选择区域截图（CAPTURE_REQUEST mode: 'region'）

但整页截图功能在 Popup 界面已有按钮占位，点击后仅输出 console.log，未实现实际功能。

## 变更内容

1. **新增整页截图消息处理流程**
   - 在 Background Service Worker 中处理 `CAPTURE_REQUEST` 的 `mode: 'fullpage'`
   - 在 Content Script 中实现页面滚动和分段截图逻辑

2. **新增整页截图核心模块**
   - 创建 `src/content/fullpage.ts` 模块
   - 实现页面滚动、分段截图、Canvas 拼接功能

3. **更新截图规范**
   - 在 `openspec/specs/screenshot/spec.md` 中新增整页截图需求

4. **Popup 界面集成**
   - 将整页截图按钮从 `console.log` 改为调用实际功能

## 影响

- **受影响规范**：`openspec/specs/screenshot/spec.md`
- **受影响代码**：
  - `src/background/index.ts` - 新增 fullpage 消息处理分支
  - `src/background/handlers/capture.ts` - 新增整页截图处理函数
  - `src/content/index.ts` - 新增 START_FULLPAGE_CAPTURE 消息监听
  - `src/content/fullpage.ts` - 新建整页截图模块
  - `src/popup/App.tsx` - 更新按钮点击处理
- **新增文件**：`src/content/fullpage.ts`

## 技术方案概述

采用**分段滚动截图 + Canvas 拼接**方案：

1. Content Script 获取页面完整尺寸（scrollWidth/scrollHeight）
2. 计算分段截图策略（每段高度 = 可视区域高度 - 重叠区）
3. 逐段滚动并调用 `chrome.tabs.captureVisibleTab()` 截图
4. 在 OffscreenCanvas 中按坐标拼接所有片段
5. 导出完整长截图并写入 storage

**重叠区设计**：每段截图保留 100px 重叠，用于处理固定定位元素（header/footer）的拼接对齐。

## 性能考虑

- 长页面（如 10000px）可能需要 10+ 次截图，总耗时约 2-5 秒
- 使用 `OffscreenCanvas` 在 Service Worker 中异步拼接，避免阻塞主线程
- 图片导出时间目标：< 5s（符合性能需求 PRD 6.1）
