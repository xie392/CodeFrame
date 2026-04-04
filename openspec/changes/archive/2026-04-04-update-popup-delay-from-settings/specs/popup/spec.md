## 修改需求
### 需求：延时截图入口行为

Popup 中「延时截取可视区域」入口必须使用 Options 设置中配置的延迟时间。

#### 场景：点击延时截图入口

- **当** 用户点击 FeatureList 中的「延时截取可视区域」按钮（Timer 图标）
- **那么** 必须从设置中读取 `delayTime` 配置
- **且** 向 Background Service Worker 发送 `CAPTURE_REQUEST` 消息，payload 包含 `mode: 'delayed'` 和 `delay` 值（来自设置）
- **且** Popup 必须在消息发送后关闭（`setTimeout(window.close, 100)`）

#### 场景：显示当前延迟时间

- **当** 用户查看延时截图入口
- **那么** 入口右侧必须显示当前设置的延迟时间（如「3s」）
- **且** 延迟时间必须与 Options 设置中的「延迟截图时间」同步

#### 场景：设置未加载时使用默认值

- **当** 设置未加载或 `delayTime` 为空
- **那么** 必须使用默认延迟时间 3 秒
- **且** 入口右侧显示「3s」
