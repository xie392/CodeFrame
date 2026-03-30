# screenshot 规范增量

## 新增需求

### 需求：整页截图捕获

系统必须支持捕获当前网页的完整内容（包括视口外区域），通过分段滚动截图并使用 Canvas 拼接生成完整长截图。

#### 场景：Popup 按钮触发整页截图

- **当** 用户在 Popup 中点击「整页截图」按钮
- **那么** Popup 必须向 Background Service Worker 发送 `CAPTURE_REQUEST` 消息，payload 包含 `mode: 'fullpage'`
- **且** Popup 必须在发送消息后立即关闭（`window.close()`）
- **且** Background Service Worker 必须向当前活动标签页的 Content Script 发送 `START_FULLPAGE_CAPTURE` 消息

#### 场景：进入整页截图模式

- **当** Content Script 收到 `START_FULLPAGE_CAPTURE` 消息
- **那么** 必须在当前页面上方创建全屏遮罩覆盖层，显示「正在截取整页，请稍候...」提示
- **且** 遮罩必须阻止用户交互，防止滚动或操作影响截图过程

#### 场景：分段滚动截图流程

- **当** Content Script 开始整页截图流程
- **那么** 必须执行以下步骤：
  1. 计算页面完整尺寸（scrollWidth, scrollHeight）
  2. 记录原始滚动位置
  3. 将页面滚动到顶部
  4. 按视口高度分段，逐段滚动并截取
  5. 每段截图通过 `CAPTURE_FULLPAGE_CHUNK` 消息发送给 Background
  6. 所有分段截图完成后，发送 `FULLPAGE_CAPTURE_COMPLETE` 消息

#### 场景：处理固定定位元素

- **当** 页面包含固定定位元素（如固定导航栏）
- **那么** 在截图前必须临时隐藏这些元素（通过 CSS class）
- **且** 截图完成后必须恢复这些元素的显示

#### 场景：Background 接收分段截图

- **当** Background 收到 `CAPTURE_FULLPAGE_CHUNK` 消息
- **那么** 必须将分段截图数据（base64）暂存到内存数组
- **且** 记录该分段的索引和坐标信息

#### 场景：拼接完整长截图

- **当** Background 收到 `FULLPAGE_CAPTURE_COMPLETE` 消息
- **那么** 必须执行以下步骤：
  1. 创建 Canvas，尺寸为页面完整宽度 x 完整高度
  2. 按索引顺序将所有分段截图绘制到 Canvas 上
  3. 处理最后一段的高度裁剪（避免空白区域）
  4. 将 Canvas 导出为 PNG base64 数据
  5. 清理内存中的临时数据

#### 场景：截图成功

- **当** 整页截图拼接完成
- **那么** 必须将 base64 imageData 写入 `chrome.storage.local`（key: `codeframe_capture_result`）
- **且** 写入数据必须包含 `success: true`、`imageData`（base64 string）、`timestamp`、`fullpage: true`
- **且** 必须自动打开 Editor 页面

#### 场景：截图失败

- **当** 截图过程中发生错误（如页面无法滚动、内存不足等）
- **那么** 必须将错误信息写入 `chrome.storage.local`
- **且** 数据必须包含 `success: false`、`error`（错误描述 string）、`timestamp`
- **且** 必须恢复页面滚动位置和固定元素显示

#### 场景：取消整页截图

- **当** 用户在截图过程中按下 `Escape` 键
- **那么** Content Script 必须停止截图流程
- **且** 必须恢复页面滚动位置和固定元素显示
- **且** 必须移除遮罩覆盖层
- **且** 必须向 Background 发送 `CANCEL_FULLPAGE_CAPTURE` 消息

#### 场景：受限页面处理

- **当** 当前标签页为受限页面（chrome://、chrome-extension://、about:、devtools://）
- **那么** 系统禁止尝试截图
- **且** 不得注入 Content Script 遮罩
- **且** 必须在 `storage` 中写入错误结果

### 需求：整页截图进度反馈

系统必须在整页截图过程中向用户提供进度反馈。

#### 场景：显示进度提示

- **当** Content Script 正在进行分段截图
- **那么** 遮罩层必须显示当前进度（如「正在截取 第 3/8 段」）
- **且** 必须显示总体进度百分比

#### 场景：进度动画

- **当** 截图进度更新时
- **那么** 进度条必须有平滑的过渡动画
- **且** 动画持续时间约 200ms
