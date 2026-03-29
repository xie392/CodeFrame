## 上下文

选择区域截图是 CodeFrame 截图模块的第二个截图模式，在已实现的可视区域截图基础上扩展。核心挑战在于：
1. Content Script 从空骨架变为完整的交互式 UI（遮罩 + 选区），这是项目中首次在 Content Script 中构建非 trivial 的 UI
2. 需要首次实现 Popup → Background → Content Script → Background 的完整三方通信链路
3. 设备像素比（DPR）处理直接影响截图裁剪精度

## 目标 / 非目标

- 目标：
  - 实现流畅的区域选择交互（拖拽选区 + 实时反馈 + 确认/取消）
  - 正确处理 DPR 缩放，确保高分辨率屏幕截图不模糊
  - 复用现有的 `captureVisibleTab()` + `chrome.storage.local` + Editor 读取链路
  - 保持 Content Script 的简洁性，不引入外部框架依赖

- 非目标：
  - 不实现选区拖拽移动/调整大小（后续迭代）
  - 不实现滚动截图或超出视口的选区（整页截图由后续变更实现）
  - 不实现固定窗口/元素选择（复杂度较高，v1.1+ 考虑）

## 决策

### 决策 1：Overlay 实现方式 — 原生 DOM + Shadow DOM

- **选择**：使用原生 DOM API 在 Content Script 中动态创建 overlay 元素，封装在 Shadow DOM 中以隔离宿主页面样式
- **替代方案**：
  - 注入 React 组件：需要额外配置 Vite 构建入口和 Shadow DOM 适配，复杂度过高
  - 纯 CSS + div：简单直接，但容易被宿主页面样式污染
- **理由**：Shadow DOM 天然隔离样式，原生 DOM 在 Content Script 中性能最优，无需构建配置变更

### 决策 2：截图裁剪策略 — Background Canvas 裁剪

- **选择**：在 Background 中先 `captureVisibleTab()` 获取全屏截图，再通过 OffscreenCanvas 裁剪目标区域
- **替代方案**：
  - Content Script 直接裁剪：Content Script 无法直接调用 `captureVisibleTab()`，数据流更复杂
  - HTML Canvas 裁剪：Background 为 Service Worker，无 DOM，必须使用 OffscreenCanvas
- **理由**：保持截图 API 调用在 Background（已有权限），Canvas 裁剪逻辑集中在一处

### 决策 3：DPR 处理方案

- **选择**：Content Script 通过 `window.devicePixelRatio` 获取 DPR，随 `CAPTURE_REGION` 消息传递给 Background；Background 在裁剪时将选区坐标乘以 DPR
- **数据流**：
  1. 用户拖拽选区得到 CSS 像素坐标 `{ x, y, width, height }`
  2. Content Script 附加 `dpr: window.devicePixelRatio`
  3. Background 裁剪时使用 `x * dpr, y * dpr, width * dpr, height * dpr`
- **理由**：`captureVisibleTab()` 返回的是物理像素图片，CSS 像素坐标需要转换

### 决策 4：Overlay 样式管理 — 内联 CSS 变量

- **选择**：Overlay 样式通过模板字符串注入 Shadow DOM 的 `<style>` 标签，关键色值引用 CSS 变量
- **替代方案**：
  - 通过 `chrome.runtime.getURL()` 加载独立 CSS 文件：需要在 `manifest.json` 中声明 `web_accessible_resources`
- **理由**：样式量小（约 100 行），内联注入更简单；如后续样式膨胀可迁移到独立文件

### 决策 5：消息通信协议

```
Popup ──CAPTURE_REQUEST (mode:'region')──> Background
                                          │
Background ──START_CAPTURE────────────────> Content Script
                                          │
Content Script ──CAPTURE_REGION───────────> Background
                    { x, y, width, height, dpr }
                                          │
Background ──captureVisibleTab + Canvas──> Storage ──> Editor
```

- `CAPTURE_REGION`：新增消息类型，从 Content Script 向 Background 传递选区坐标
- `CANCEL_CAPTURE`：新增消息类型，用户取消选区时通知 Background
- 复用现有 `CAPTURE_REQUEST` 消息类型，扩展 `mode` 字段

## 风险 / 权衡

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Shadow DOM 兼容性 | 旧版浏览器不支持 | Manifest V3 要求 Chrome 88+，已原生支持 Shadow DOM |
| OffscreenCanvas 兼容性 | Service Worker 环境限制 | Chrome 88+ 已支持 OffscreenCanvas |
| 高 DPR 屏幕（3x/4x）裁剪精度 | 边缘可能略模糊 | 使用 `Math.round()` 对齐像素边界 |
| 宿主页面 CSS 冲突 | overlay 被覆盖 | Shadow DOM 完全隔离 |
| 页面滚动后坐标偏移 | 选区位置不正确 | 选区坐标基于视口（viewport），不考虑文档坐标；选区模式下禁止滚动（可选） |

## 待决问题

- 是否需要在选区模式下禁止页面滚动？（当前方案：允许滚动，选区保持视口相对位置）
- 选区操作按钮是否需要支持键盘快捷键（如 Enter 确认、Escape 取消）？（建议：Escape 取消必须支持）
