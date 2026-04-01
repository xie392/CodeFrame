## ADDED Requirements

### Requirement: Editor 页面整体布局

editor 页面 MUST 采用三栏布局：左侧工具栏（56px）、中央画布区域（弹性填充）、右侧属性面板（280px）。页面 MUST 占满整个视口（100vw x 100vh）。

#### Scenario: 页面初始化

- **当** 用户打开 editor 页面
- **那么** 页面 MUST 显示三栏布局，无滚动条，占满整个视口
- **并且** 工具栏 MUST 在左侧固定宽度 56px
- **并且** 画布区域 MUST 填满剩余中间空间
- **并且** 属性面板 MUST 在右侧固定宽度 280px

### Requirement: 左侧工具栏

左侧工具栏 MUST 包含编辑工具按钮和操作按钮，MUST 采用毛玻璃效果背景。

#### Scenario: 工具栏布局

- **当** editor 页面加载完成
- **那么** 工具栏 MUST 垂直排列 8 个按钮区域：选择工具、箭头、矩形、文字、马赛克、裁剪、分隔线、撤销、重做
- **并且** 每个工具按钮尺寸 MUST 为 40x40px，圆角 12px
- **并且** 当前选中工具 MUST 高亮显示（背景色 `#FF6B35`，图标色 `#0D0D0D`）
- **并且** 未选中工具图标色 MUST 为 `#777777`

#### Scenario: 工具栏视觉样式

- **当** 工具栏渲染
- **那么** 工具栏背景 MUST 使用毛玻璃渐变效果
- **并且** 工具栏右侧 MUST 有 1px 边框
- **并且** 工具栏内边距 MUST 为上下 12px、左右 8px

### Requirement: 中央画布区域

中央画布区域 MUST 作为图片显示和编辑的主工作区。

#### Scenario: 带图模式初始化

- **当** editor 页面以 `?source=capture` 参数打开
- **那么** 页面 MUST 从 `chrome.storage.local` 读取截图数据
- **并且** 读取成功后 MUST 在画布区域居中显示截图图片
- **并且** 读取失败时 MUST 在画布区域显示错误提示

#### Scenario: 空画布模式显示上传提示

- **当** editor 页面以 `?source=upload` 参数或无参数打开
- **那么** 画布区域 MUST 显示上传提示
- **并且** 提示区域 MUST 支持拖拽图片文件
- **并且** 提示区域 MUST 支持点击选择文件
- **并且** 页面 MUST 全局监听 `paste` 事件

#### Scenario: 拖拽上传图片

- **当** 用户将图片文件拖拽到画布区域并释放
- **那么** 系统 MUST 读取文件内容并在画布中居中显示该图片
- **并且** MUST 仅接受 png、jpeg、webp、gif 格式

#### Scenario: 粘贴上传图片

- **当** 用户在 editor 页面按下 Ctrl+V（或 Cmd+V）
- **并且** 剪贴板中包含图片数据
- **那么** 系统 MUST 从剪贴板读取图片数据并在画布中居中显示

### Requirement: 右侧属性面板

右侧属性面板 MUST 显示选中工具的属性设置区域。

#### Scenario: 属性面板布局

- **当** editor 页面加载完成
- **那么** 属性面板 MUST 显示标题
- **并且** 属性面板 MUST 使用毛玻璃渐变背景效果
- **并且** 属性面板左侧 MUST 有 1px 边框
- **并且** 面板内边距 MUST 为上下 20px、左右 16px

### Requirement: 从 Popup 跳转到 Editor

popup 页面中"编辑本地或粘贴图片"按钮 MUST 能够正确跳转到 editor 页面。

#### Scenario: 点击编辑图片按钮

- **当** 用户在 popup 中点击"编辑本地或粘贴图片"按钮
- **那么** 系统 MUST 通过 `chrome.tabs.create()` 在新标签页中打开 editor 页面
- **并且** popup 窗口 MUST 关闭

### Requirement: 截图完成后跳转到 Editor

截图完成后 MUST 自动跳转到 editor 页面并携带截图数据。

#### Scenario: 截图成功后跳转

- **当** 任意截图操作成功完成
- **并且** 截图结果已写入 `chrome.storage.local`
- **那么** 系统 MUST 通过 `chrome.tabs.create()` 在新标签页中打开 editor 页面
