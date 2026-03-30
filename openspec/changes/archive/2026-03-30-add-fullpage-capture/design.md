# 整页截图技术设计

## 上下文

整页截图是 CodeFrame 截图功能的核心能力之一。与可视区域截图不同，整页截图需要捕获超出视口范围的完整网页内容，包括需要滚动才能看到的内容。

## 目标

- 支持任意长度网页的完整截图
- 自动滚动拼接，无需用户干预
- 处理固定定位元素（如导航栏、侧边栏）
- 保持图片质量和页面布局一致性

## 非目标

- 不支持 iframe 内部内容（受浏览器安全限制）
- 不支持动态加载内容的无限滚动页面（仅捕获当前已加载内容）
- 不支持视频/Canvas 动画的每一帧

## 技术方案决策

### 决策 1：分段滚动截图 + Canvas 拼接

**选择**：通过 Content Script 控制页面滚动，分段捕获可视区域，最后在 Background 中使用 OffscreenCanvas 拼接。

**理由**：
- Chrome Extension API 没有原生整页截图 API
- `chrome.tabs.captureVisibleTab()` 只能捕获可视区域
- 分段截图可以精确控制滚动位置和拼接精度

**替代方案**：
- 使用 `html-to-image` 等库直接转换 DOM：受 CORS 限制，且可能遗漏某些 CSS 样式
- 使用 Chrome DevTools Protocol：Manifest V3 不支持

### 决策 2：Content Script 执行滚动逻辑

**选择**：Content Script 负责计算页面尺寸、执行滚动、收集各段截图坐标信息。

**理由**：
- Content Script 可以直接访问页面 DOM 和窗口尺寸
- 可以精确控制滚动行为（scrollTo）
- 可以获取 document 的完整 scrollHeight

**流程**：
1. Content Script 计算页面总高度和分段数
2. 逐段滚动到指定位置
3. 每滚动一次通知 Background 执行截图
4. 截图完成后通知 Content Script 继续滚动
5. 所有分段完成后，Background 拼接 Canvas

### 决策 3：固定定位元素处理

**选择**：检测并临时隐藏固定定位元素，拼接完成后再恢复。

**理由**：
- 固定定位元素（position: fixed/sticky）会在每次截图中重复出现
- 直接拼接会导致顶部/底部出现重复内容

**实现**：
```typescript
// 临时隐藏固定定位元素
const fixedElements = document.querySelectorAll('[style*="position: fixed"], [style*="position:sticky"]');
fixedElements.forEach(el => (el as HTMLElement).style.visibility = 'hidden');
// 截图完成后恢复
```

### 决策 4：滚动重叠区域

**选择**：每段截图保留 100px 重叠区域用于对齐参考（可选优化）。

**理由**：
- 某些页面滚动时元素位置可能有微小偏移
- 重叠区域可以作为对齐参考点（当前实现暂不需要，作为未来优化点）

## 数据流设计

```
┌─────────┐     CAPTURE_FULLPAGE      ┌─────────────┐
│  Popup  │ ─────────────────────────► │ Background  │
└─────────┘                            └──────┬──────┘
                                              │
                                              ▼ START_FULLPAGE_CAPTURE
                                        ┌─────────────┐
                                        │   Content   │
                                        └──────┬──────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
            ┌───────────────┐         ┌───────────────┐         ┌───────────────┐
            │  Scroll to 0  │         │  Scroll to N  │         │  Scroll end   │
            └───────┬───────┘         └───────┬───────┘         └───────┬───────┘
                    │                         │                         │
                    ▼ FULLPAGE_SCREENSHOT     ▼ FULLPAGE_SCREENSHOT     ▼ FULLPAGE_COMPLETE
            ┌───────────────┐         ┌───────────────┐         ┌───────────────┐
            │  Background   │         │  Background   │         │  Background   │
            │  captureTab   │         │  captureTab   │         │  Stitch all   │
            │  store chunk  │         │  store chunk  │         │  Save result  │
            └───────────────┘         └───────────────┘         └───────────────┘
```

## 接口设计

### 新增消息类型

```typescript
// 开始整页截图
type 'START_FULLPAGE_CAPTURE' = {
  scrollHeight: number;
  viewportHeight: number;
}

// 请求截图某一段
type 'FULLPAGE_SCREENSHOT' = {
  scrollY: number;
  chunkIndex: number;
  totalChunks: number;
}

// 整页截图完成
type 'FULLPAGE_COMPLETE' = {
  chunks: Array Array<{
    imageData: string;
    scrollY: number;
  }>;
}
```

## 性能考虑

| 优化点 | 策略 |
|--------|------|
| 截图分段 | 每段高度 = viewportHeight - 重叠区域(100px)，减少分段数 |
| Canvas 内存 | 使用 OffscreenCanvas，及时释放 ImageBitmap |
| 滚动等待 | 每次滚动后等待 150ms，确保渲染完成 |
| 大页面处理 | 超过 20 段的页面显示进度提示 |

## 错误处理

| 错误场景 | 处理方式 |
|----------|----------|
| 页面高度变化 | 记录警告，使用最新高度继续 |
| 截图失败 | 中断流程，返回已捕获内容和错误信息 |
| 内存不足 | 分段保存到 storage，最后读取拼接 |

## 待决问题

- [ ] 是否需要支持懒加载图片的预加载？（当前：不支持，仅捕获已加载内容）
- [ ] 是否需要支持横向滚动页面？（当前：不支持，仅垂直滚动）
