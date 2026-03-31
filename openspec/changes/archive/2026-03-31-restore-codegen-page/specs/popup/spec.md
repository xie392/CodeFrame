## 新增需求

### 需求：代码编辑器按钮跳转

Popup 页面 FeatureList 中的"代码编辑器"按钮必须实现在新标签页中打开 CodeGen 页面的跳转逻辑。

#### 场景：点击代码编辑器按钮

- **当** 用户在 Popup 页面 FeatureList 中点击"代码编辑器"按钮（Code 图标）
- **那么** 必须使用 `chrome.tabs.create` 在新标签页中打开 CodeGen 页面
- **且** Popup 窗口必须在打开新标签页后关闭
