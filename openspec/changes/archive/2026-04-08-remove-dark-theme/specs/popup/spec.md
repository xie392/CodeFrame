## 修改需求

### 需求：Header 区域

Header 区域必须包含 Logo 和设置按钮，高度 47px，水平 padding 16px。

#### 场景：Logo 显示

- **当** 用户查看 Header 左侧
- **那么** 必须显示 Logo 方块（28×28px，背景 #FF6B35，圆角 8px）内含 "CF" 文字
- **且** "CF" 文字必须使用 Oswald 字体，13px，font-weight 700，颜色 #0D0D0D
- **且** Logo 右侧必须显示 "CodeFrame" 文字，Oswald 16px，font-weight 600

#### 场景：操作按钮

- **当** 用户查看 Header 右侧
- **那么** 必须仅显示 Settings 图标按钮
- **且** 按钮尺寸必须为 32×32px，背景 #f0f0f0，圆角 8px
- **且** 图标尺寸必须为 15×15px，颜色 #888888
- **且** 禁止存在主题切换按钮
