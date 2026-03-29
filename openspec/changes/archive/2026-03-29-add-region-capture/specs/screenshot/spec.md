## 新增需求

### 需求：选择区域截图

系统必须允许用户通过鼠标拖拽在当前页面上精确选取矩形区域进行截图，截图结果以 PNG 格式 base64 数据存储。

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

### 需求：区域选择交互体验

系统必须在区域选择过程中提供流畅、直观的交互体验。

#### 场景：鼠标光标样式

- **当** 遮罩覆盖层处于活动状态
- **那么** 鼠标在遮罩上必须显示十字准星光标（`crosshair`）
- **且** 鼠标在操作按钮上必须显示指针光标（`pointer`）

#### 场景：选区边框样式

- **当** 选区被绘制
- **那么** 选区边框必须为 1px 实线，颜色与设计系统强调色一致（`#10B981`）
- **且** 选区四角必须显示 4x4 像素的方形控制点

#### 场景：尺寸标注位置

- **当** 选区面积足够显示标注（宽 > 100px 或高 > 40px）
- **那么** 尺寸标注必须显示在选区底部居中位置
- **且** 标注背景必须与设计系统暗色背景一致（`#1F1F1F`）
- **且** 标注文字必须使用设计系统辅助文字颜色（`#FAFAFA`），字体 12px

#### 场景：移动窗口或滚动页面

- **当** 用户在选区模式下滚动页面
- **那么** 遮罩必须跟随滚动保持全屏覆盖
- **且** 已绘制的选区必须保持相对于视口的位置
