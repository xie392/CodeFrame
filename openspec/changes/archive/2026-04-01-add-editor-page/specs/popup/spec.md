## MODIFIED Requirements

### Requirement: Popup FeatureList

popup 页面的 FeatureList MUST 包含完整的截图功能列表和代码编辑器入口，每个功能项 MUST 可点击触发对应操作。

#### Scenario: FeatureList 功能项

- **当** popup 页面加载完成
- **那么** FeatureList MUST 包含以下功能项：延时截取可视区域、桌面截图、编辑本地或粘贴图片、代码编辑器
- **并且** "编辑本地或粘贴图片"按钮点击后 MUST 打开 editor 页面并关闭 popup
