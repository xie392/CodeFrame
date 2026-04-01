## 1. Popup 跳转逻辑

- [x] 1.1 实现 `handleOpenEditor()` 函数，通过 `chrome.tabs.create()` 打开 editor 页面
- [x] 1.2 将 popup 中"编辑本地或粘贴图片"按钮的 `onClick` 从 `console.log` 改为调用 `handleOpenEditor()`
- [x] 1.3 验证：点击按钮后新标签页正确打开 editor 页面，popup 关闭

## 2. 截图完成后跳转

- [x] 2.1 在 background handler 的截图完成逻辑中，截图成功后调用 `chrome.tabs.create()` 打开 editor 页面并携带 `?source=capture` 参数
- [x] 2.2 验证：截图完成后自动跳转到 editor 页面并显示截图图片

## 3. Editor 页面 UI 布局

- [x] 3.1 重写 `src/editor/App.tsx`，实现三栏布局（工具栏 + 画布 + 属性面板）
- [x] 3.2 左侧工具栏（56px）：毛玻璃效果背景，6 个工具按钮 + 分隔线 + 撤销/重做按钮
- [x] 3.3 中央画布区域（flex-1）：图片居中显示，带标签
- [x] 3.4 右侧属性面板（280px）：毛玻璃效果背景，显示 `// properties` 标题和占位区域
- [x] 3.5 验证：页面布局与 ui.pen Editor 设计稿一致

## 4. Editor 页面进入模式处理

- [x] 4.1 解析 URL 查询参数，区分 `source=capture`（带图）和 `source=upload`（空画布）两种模式
- [x] 4.2 带图模式：从 `chrome.storage.local` 读取截图数据并显示在画布中
- [x] 4.3 空画布模式：显示上传提示区域（拖拽/点击/粘贴）
- [x] 4.4 实现拖拽上传：拖拽图片文件到画布区域后加载并显示
- [x] 4.5 实现点击上传：点击上传区域后触发文件选择器
- [x] 4.6 实现粘贴上传：监听全局 `paste` 事件，从剪贴板读取图片数据
- [x] 4.7 验证：两种模式均正常工作
