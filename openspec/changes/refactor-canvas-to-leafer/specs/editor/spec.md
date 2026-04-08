## 修改需求

### 需求:编辑器主组件架构
编辑器 App.tsx 必须从直接管理 Canvas 逻辑变为渲染路径选择层。App.tsx 必须根据 feature flag 选择渲染 Canvas2DCanvas 或 LeaferCanvas 组件，且两种路径共享同一个 Zustand Store。

#### 场景:App.tsx 渲染路径选择
- **当** App.tsx 渲染时
- **那么** 根据 `isLeaferEnabled()` 返回值选择渲染 `LeaferCanvas` 或 `Canvas2DCanvas`

#### 场景:共享 Store 状态
- **当** 用户在 LeaferJS 路径下创建一个箭头
- **那么** Store 中 arrows 数组新增一条记录，切换到 Canvas 2D 路径后该箭头也必须可见

#### 场景:帧容器叠加关系
- **当** LeaferJS 路径渲染时
- **那么** FrameContainer（CSS 渲染）作为底层，Leafer Canvas 作为标注覆盖层，两者通过缩放平移容器对齐
