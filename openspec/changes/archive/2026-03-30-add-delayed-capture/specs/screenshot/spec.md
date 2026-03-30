## 新增需求

### 需求：延时截取可视区域

系统必须支持用户设定延时（3 秒 / 5 秒 / 10 秒）后自动捕获当前活动标签页的可视区域截图。延时期间必须在页面上显示倒计时覆盖层，倒计时结束后自动执行截图并打开编辑器。

#### 场景：Popup 触发延时截图

- **当** 用户在 Popup 中点击「延时截取可视区域」入口
- **那么** 必须展示延时选项（3 秒、5 秒、10 秒）供用户选择
- **且** 用户选择延时后，Popup 必须向 Background Service Worker 发送 `CAPTURE_REQUEST` 消息，payload 包含 `mode: 'delayed'` 和 `delay: <秒数>`
- **且** Popup 必须在消息发送后关闭

#### 场景：倒计时覆盖层显示

- **当** Content Script 收到 `START_DELAYED_CAPTURE` 消息
- **那么** 必须在当前页面上方创建全屏半透明覆盖层
- **且** 覆盖层中央必须显示圆形进度环和剩余秒数数字
- **且** 覆盖层下方页面内容必须保持可见（半透明遮罩，透明度约 0.6）
- **且** 倒计时必须每秒递减并更新 UI

#### 场景：倒计时结束自动截图

- **当** 倒计时归零
- **那么** Content Script 必须移除覆盖层
- **且** Content Script 必须向 Background 发送 `CAPTURE_DELAYED_READY` 消息
- **且** Background 必须调用 `chrome.tabs.captureVisibleTab()` 捕获当前可视区域
- **且** 截图结果必须写入 `chrome.storage.local` 并自动打开 Editor 页面

#### 场景：倒计时期间取消

- **当** 用户在倒计时期间按下 `Escape` 键
- **那么** Content Script 必须立即移除覆盖层并停止倒计时
- **且** Content Script 必须向 Background 发送 `CANCEL_DELAYED_CAPTURE` 消息
- **且** 不得执行任何截图操作

#### 场景：延时截图成功

- **当** 延时截图成功完成
- **那么** 截图的 base64 imageData 必须写入 `chrome.storage.local`
- **且** 写入数据必须包含 `success: true`、`imageData`（base64 string）、`timestamp`、`mode: 'delayed'`

#### 场景：延时截图失败

- **当** 延时截图过程中发生错误（如受限页面、权限被拒绝）
- **那么** 必须将错误信息写入 `chrome.storage.local`
- **且** 数据必须包含 `success: false`、`error`（错误描述 string）、`timestamp`

#### 场景：受限页面处理

- **当** 当前标签页为受限页面（chrome://、chrome-extension://、about:、devtools://）
- **那么** 系统禁止启动延时截图流程
- **且** 不得注入倒计时覆盖层
- **且** 必须在 `storage` 中写入错误结果

### 需求：倒计时覆盖层交互体验

倒计时覆盖层必须在延时截图期间提供清晰、直观的视觉反馈。

#### 场景：覆盖层视觉样式

- **当** 倒计时覆盖层处于活动状态
- **那么** 背景必须为半透明深色遮罩（rgba(0, 0, 0, 0.6)）
- **且** 中央圆形进度环尺寸必须为 80×80px
- **且** 进度环颜色必须为设计系统强调色（#10B981）
- **且** 秒数数字必须为 36px，白色（#FAFAFA）
- **且** 必须在圆形下方显示「取消 (Esc)」提示文字（12px，#6B7280）

#### 场景：进度环动画

- **当** 倒计时进行中
- **那么** 进度环必须从满圈逐渐减少到空圈
- **且** 每秒更新一次，动画过渡平滑（CSS transition duration 1s）
- **且** 秒数数字必须同步递减

#### 场景：最后一秒视觉强调

- **当** 倒计时剩余 1 秒
- **那么** 进度环颜色必须变为警告色（#F59E0B）
- **且** 秒数数字必须轻微放大（scale 1.1）
