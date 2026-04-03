## 修改需求

### 需求：i18n 翻译配置
系统必须正确配置所有 UI 文本的翻译 key，确保嵌套对象和字符串 key 分离使用。

#### 场景：标签文本使用字符串 key
- **当** 组件需要显示标签文本（如"窗口样式"）
- **那么** 使用 `label.xxx` 格式的字符串 key，而非嵌套对象 key

#### 场景：选项值使用嵌套对象 key
- **当** 组件需要渲染选项列表（如窗口样式选项：macOS/Windows/无）
- **那么** 使用 `xxx.optionName` 格式的嵌套 key 获取翻译

### 需求：SelectControl 组件翻译
SelectControl 组件必须对选项名称进行 i18n 翻译。

#### 场景：选项名称翻译
- **当** SelectControl 接收 `options` 数组（如 `[{name: 'aspectRatio.auto', value: 'auto'}]`）
- **那么** 组件必须调用 `t(opt.name)` 进行翻译，显示"自动"而非"aspectRatio.auto"

#### 场景：非 i18n key 选项兼容
- **当** 选项 `name` 是普通文本（如 '1:1'、'iPhone'）而非 i18n key
- **那么** 组件应正确显示原始文本
