# 整页截图功能实施任务清单

## 1. 背景层 (Background) 实现

- [ ] 1.1 创建 `src/background/handlers/fullpage.ts` 处理整页截图核心逻辑
- [ ] 1.2 实现 `captureFullPage()` 函数，协调 Content Script 和截图流程
- [ ] 1.3 实现多片段图像拼接逻辑，使用 OffscreenCanvas
- [ ] 1.4 添加整页截图结果存储到 `chrome.storage.local`
- [ ] 1.5 在 `src/background/index.ts` 中注册 `CAPTURE_FULLPAGE` 消息处理器

## 2. 内容脚本层 (Content Script) 实现

- [ ] 2.1 在 `src/content/index.ts` 中添加 `CAPTURE_FULLPAGE_START` 消息监听
- [ ] 2.2 实现页面滚动和分段截图逻辑
- [ ] 2.3 实现获取页面完整尺寸信息（含滚动区域）
- [ ] 2.4 处理固定定位元素（header/footer）的去重逻辑
- [ ] 2.5 分段截图数据返回 Background 进行拼接

## 3. 用户界面层 (Popup) 更新

- [ ] 3.1 更新 `src/popup/App.tsx` 中的整页截图按钮点击处理
- [ ] 3.2 实现 `handleFullPageCapture()` 函数发送 `CAPTURE_REQUEST` 消息（mode: 'fullpage'）
- [ ] 3.3 添加整页截图的加载状态提示

## 4. 消息类型和常量定义

- [ ] 4.1 在 `src/shared/messages.ts` 中添加 `CAPTURE_FULLPAGE_START` 和 `CAPTURE_FULLPAGE_SCROLL` 消息类型
- [ ] 4.2 在 `src/shared/types.ts` 中添加整页截图相关的类型定义（如 `FullPageCaptureProgress`）
- [ ] 4.3 在 `src/shared/constants.ts` 中添加整页截图配置参数（如每次滚动高度、最大截图高度限制）

## 5. 快捷键支持

- [ ] 5.1 在 `manifest.json` 中添加整页截图的快捷键命令（如 `Alt+Shift+F`）
- [ ] 5.2 在 `src/background/index.ts` 的 `chrome.commands.onCommand` 监听器中添加整页截图处理

## 6. 测试与验证

- [ ] 6.1 测试普通网页的整页截图
- [ ] 6.2 测试长页面（高度 > 10000px）的截图
- [ ] 6.3 测试包含固定 header/footer 的页面
- [ ] 6.4 测试 iframe 内嵌页面的截图行为
- [ ] 6.5 验证受限页面（chrome:// 等）的拦截提示

## 7. 文档更新

- [ ] 7.1 更新 `openspec/specs/screenshot/spec.md`，添加整页截图需求规范
- [ ] 7.2 更新功能设计文档中的截图模块说明（如需要）

## 依赖关系

```
4.1, 4.2, 4.3 (消息/类型定义)
    ↓
1.1, 1.2, 1.3, 1.4 (Background 实现)
    ↓
2.1, 2.2, 2.3, 2.4, 2.5 (Content Script 实现)
    ↓
3.1, 3.2, 3.3 (Popup 更新)
    ↓
5.1, 5.2 (快捷键支持)
    ↓
6.1 ~ 6.5 (测试验证)
    ↓
7.1, 7.2 (文档更新)
```

## 验收标准

- [ ] 用户点击"整页截图"按钮后，能够自动滚动页面并捕获完整内容
- [ ] 截图结果自动保存到 storage 并打开 Editor 页面
- [ ] 长页面截图时间 < 5 秒（性能指标）
- [ ] 截图质量清晰，无明显的拼接痕迹
- [ ] 受限页面正确拦截并显示错误提示
