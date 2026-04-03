## 修改需求
### 需求：可视区域截图捕获

系统必须支持通过 `chrome.tabs.captureVisibleTab()` API 捕获当前活动标签页的可视区域截图，截图结果以 PNG 格式 base64 数据存储，并根据用户设置的截图质量进行缩放处理。

#### 场景：Popup 按钮触发截图

- **当** 用户在 Popup 中点击"可视截图"按钮
- **那么** Popup 必须向 Background Service Worker 发送 `CAPTURE_REQUEST` 消息，payload 包含 `mode: 'visible'`
- **且** Popup 必须在发送消息后立即关闭（`window.close()`）
- **且** Background Service Worker 必须调用 `chrome.tabs.captureVisibleTab()` 捕获当前标签页
- **且** 截图完成后必须将 base64 imageData 写入 `chrome.storage.local`（key: `codeframe_capture_result`）

#### 场景：快捷键触发截图

- **当** 用户按下 `Alt+Shift+S` 快捷键
- **那么** Background Service Worker 必须触发可视区域截图
- **且** 截图流程必须与按钮触发一致

#### 场景：截图成功

- **当** `chrome.tabs.captureVisibleTab()` 成功返回 dataURL
- **然后** 必须 `Base64` 编码后的截图数据写入 `chrome.storage.local`
- **且** `write` 数据必须包含 `success: true`、`imageData`（base64 string）、`timestamp`

#### 场景：截图失败

- **当** `chrome.tabs.captureVisibleTab()` 调用失败（如受限页面 chrome://、about:）
- **那么** 必须 `将` 错误信息写入 `chrome.storage.local`
- **且** `数据` 必须包含 `success: false`、`error`（错误描述 string）、`timestamp`

#### 场景：受限页面处理

- **当** 当前标签页为受限页面（chrome://、chrome-extension://、about:、devtools://）
- **那么** 系统禁止尝试截图
- **且** 必须在 `storage` 中写入错误结果 `error` 包含"受限页面不支持截图"提示

#### 场景：应用截图质量设置

- **当** 截图捕获完成
- **那么** 系统必须读取用户的截图质量设置（1x/2x/3x）
- **且** 若质量设置为 1x，截图直接存储，不做缩放处理
- **且** 若质量设置为 2x，必须通过 Canvas 将截图缩放至 2 倍尺寸
- **且** 若质量设置为 3x，必须通过 Canvas 将截图缩放至 3 倍尺寸
- **且** 缩放后的图片必须保持清晰度，使用高质量插值算法

---

### 需求：选择区域截图

系统必须允许用户通过鼠标拖拽在当前页面上精确选取矩形区域进行截图，截图结果以 PNG 格式 base64 数据存储，并根据用户设置的截图质量进行缩放处理。

#### 场景：Popup 按钮触发区域截图

- **当** 用户在 Popup 中点击「选择区域」按钮
- **那么** Popup 必须向 Background Service Worker 发送 `CAPTURE_REQUEST` 消息，payload 包含 `mode: 'region'`
- **且** Popup 必须在发送消息后立即关闭（`window.close()`）
- **且** Background Service Worker 必须向当前活动标签页的 Content Script 发送 `START_CAPTURE` 消息

#### 场景：快捷键触发区域截图

- **当** 用户按下 `Alt+Shift+R` 快捷键
- **那么** Background Service Worker 必须向当前活动标签页的 Content Script 发送 `START_CAPTURE` 消息
- **且** 后续流程必须与按钮触发一致

#### 场景：进入区域选择模式

- **当** Content Script 收到 `START_CAPTURE` 消息
- **那么** 必须在当前页面上方创建全屏半透明遮罩覆盖层（overlay）
- **且** 遮罩必须覆盖整个可视区域（`position: fixed; inset: 0; z-index` 最大化）
- **且** 遮罩下方页面内容必须保持可见（半透明，透明度约 0.3-0.5）
- **且** 必须显示操作提示（如「拖拽选择截图区域」）

#### 场景：拖拽绘制选区

- **当** 用户在遮罩层上按下鼠标并拖动
- **那么** 必须实时绘制矩形选区边框
- **且** 选区内部必须为透明（清晰可见下方页面内容）
- **且** 选区外部必须保持半透明遮罩
- **且** 必须实时显示选区尺寸标注（宽 x 高，单位 px）
- **且** 必须在选区右上角显示操作按钮（确认截图 / 取消）

#### 场景：确认选区并截图

- **当** 用户完成拖拽后点击「确认截图」按钮
- **那么** Content Script 必须向 Background 发送 `CAPTURE_REGION` 消息，payload 包含选区坐标 `{ x, y, width, height, dpr }`
- **且** Content Script 必须移除遮罩覆盖层
- **且** Background 必须先调用 `chrome.tabs.captureVisibleTab()` 获取完整可视区域截图
- **且** Background 必须使用 Canvas 根据选区坐标裁剪目标区域（考虑 `dpr` 设备像素比缩放）
- **且** 裁剪结果必须写入 `chrome.storage.local`（key: `codeframe_capture_result`）

#### 场景：取消区域选择

- **当** 用户点击「取消」按钮或按下 `Escape` 键
- **那么** Content Script 必须立即移除遮罩覆盖层
- **且** 必须向 Background 发送 `CANCEL_CAPTURE` 消息
- **且** 不得执行任何截图操作

#### 场景：选区太小

- **当** 用户绘制的选区面积小于 10x10 像素
- **那么** 必须在选区旁显示提示「选区太小，请重新选择」
- **且** 禁用「确认截图」按钮
- **且** 用户松开鼠标后必须自动重置选区

#### 场景：截图成功

- **当** 区域裁剪成功完成
- **那么** 裁剪后的 base64 imageData 必须写入 `chrome.storage.local`
- **且** 写入数据必须包含 `success: true`、`imageData`（base64 string）、`timestamp`、`region`（选区坐标）
- **且** 必须自动打开 Editor 页面

#### 场景：截图失败

- **当** 裁剪过程中发生错误
- **那么** 必须将错误信息写入 `chrome.storage.local`
- **且** 数据必须包含 `success: false`、`error`（错误描述 string）、`timestamp`

#### 场景：受限页面处理

- **当** 当前标签页为受限页面（chrome://、chrome-extension://、about:、devtools://）
- **那么** 系统禁止尝试截图
- **且** 不得注入 Content Script overlay
- **且** 必须在 `storage` 中写入错误结果

#### 场景：区域截图应用截图质量设置

- **当** 区域截图裁剪完成
- **那么** 系统必须读取用户的截图质量设置（1x/2x/3x）
- **且** 若质量设置为 1x，裁剪后直接存储，不做额外缩放
- **且** 若质量设置为 2x，必须通过 Canvas 将裁剪结果缩放至 2 倍尺寸
- **且** 若质量设置为 3x，必须通过 Canvas 将裁剪结果缩放至 3 倍尺寸

---

### 需求：整页截图捕获

系统必须支持自动滚动页面并拼接生成完整的长截图，捕获整个网页内容（包括可视区域外的滚动内容），并根据用户设置的截图质量进行缩放处理。

#### 场景：Popup 按钮触发整页截图

- **当** 用户在 Popup 中点击「整页截图」按钮
- **那么** Popup 必须向 Background Service Worker 发送 `CAPTURE_REQUEST` 消息，payload 包含 `mode: 'fullpage'`
- **且** Popup 必须在发送消息后立即关闭（`window.close()`）
- **且** Background Service Worker 必须向当前活动标签页的 Content Script 发送 `CAPTURE_FULLPAGE_START` 消息

#### 场景：快捷键触发整页截图

- **当** 用户按下 `Alt+Shift+F` 快捷键
- **那么** Background Service Worker 必须触发整页截图流程
- **且** 流程必须与按钮触发一致

#### 场景：进入整页截图模式

- **当** Content Script 收到 `CAPTURE_FULLPAGE_START` 消息
- **那么** 必须计算页面完整尺寸（`document.documentElement.scrollWidth/scrollHeight`）
- **且** 必须计算分段截图策略（每段高度 = 可视区域高度 - 重叠区 100px）
- **且** 必须在页面底部显示进度提示「整页截图中...（1/N）」

#### 场景：分段截图流程

- **当** 整页截图模式已启动
- **那么** Content Script 必须按以下流程执行：
  1. 滚动页面到指定位置（从顶部开始，每次向下滚动 `viewportHeight - 100px`）
  2. 等待 150ms 确保页面渲染稳定
  3. 向 Background 发送 `CAPTURE_FULLPAGE_SCROLL` 消息，包含当前滚动位置
  4. Background 调用 `chrome.tabs.captureVisibleTab()` 捕获当前可视区域
  5. 保存截图片段数据，返回成功确认给 Content Script
  6. Content Script 继续下一段，直到覆盖整个页面高度

#### 场景：图像拼接

- **当** 所有分段截图已完成
- **那么** Background 必须使用 `OffscreenCanvas` 拼接所有片段
- **且** 画布尺寸必须为 `fullWidth x fullHeight`（按 DPR 缩放）
  - `fullWidth = scrollWidth * dpr`
  - `fullHeight = scrollHeight * dpr`
- **且** 每个片段必须按以下坐标绘制：
  - `dx = 0`
  - `dy = scrollY * dpr`（当前片段的滚动位置）
- **且** 最后一段不足 viewportHeight 时，必须裁剪片段底部以适应剩余高度

#### 场景：固定元素处理

- **当** 页面包含固定定位元素（如 header、footer）
- **那么** 拼接时必须使用 100px 重叠区进行去重
- **且** 相邻片段的重叠区域必须通过像素比对或透明度混合消除重复内容
- **注意**：当前版本采用简单叠加策略，固定元素可能重复出现

#### 场景：截图完成

- **当** 图像拼接成功完成
- **那么** 完整截图的 base64 imageData 必须写入 `chrome.storage.local`
- **且** 写入数据必须包含 `success: true`、`imageData`（base64 string）、`timestamp`、`mode: 'fullpage'`、`originalSize`（原始页面尺寸）
- **且** 必须自动打开 Editor 页面

#### 场景：截图失败

- **当** 整页截图过程中发生错误（如页面被关闭、权限被拒绝）
- **那么** 必须将错误信息写入 `chrome.storage.local`
- **且** 数据必须包含 `success: false`、`error`（错误描述 string）、`timestamp`

#### 场景：取消整页截图

- **当** 用户在截图过程中按下 `Escape` 键
- **那么** Content Script 必须停止截图流程
- **且** 必须向 Background 发送 `CANCEL_CAPTURE` 消息
- **且** 必须隐藏进度提示

#### 场景：受限页面处理

- **当** 当前标签页为受限页面（chrome://、chrome-extension://、about:、devtools://）
- **那么** 系统禁止尝试截图
- **且** 必须在 `storage` 中写入错误结果 `error` 包含「受限页面不支持截图」提示

#### 场景：整页截图应用截图质量设置

- **当** 整页截图拼接完成
- **那么** 系统必须读取用户的截图质量设置（1x/2x/3x）
- **且** 若质量设置为 1x，拼接后直接存储，不做额外缩放
- **且** 若质量设置为 2x，必须通过 Canvas 将拼接结果缩放至 2 倍尺寸
- **且** 若质量设置为 3x，必须通过 Canvas 将拼接结果缩放至 3 倍尺寸
