## 新增需求

### 需求:LeaferJS 渲染后端
系统必须实现 `LeaferBackend` 类，实现 `IRendererBackend` 接口，基于 LeaferJS 引擎渲染所有标注图形。

#### 场景:初始化 Leafer App
- **当** 调用 `LeaferBackend.init({ container, imageDisplaySize })`
- **那么** 创建 Leafer App 实例，挂载到 container，配置 Editor 和 Viewport 插件

#### 场景:销毁 Leafer App
- **当** 调用 `LeaferBackend.destroy()`
- **那么** 销毁 Leafer App 实例，移除 DOM 元素，清理事件监听

### 需求:LeaferJS 箭头图形适配器
系统必须提供 `LeaferArrowAdapter` 实现 `IShapeAdapter<ArrowShape>`，使用 `@leafer-in/arrow` 插件的 Arrow 元素渲染箭头标注。箭头必须支持单箭头和双箭头样式。

#### 场景:创建箭头
- **当** Store 新增 ArrowShape `{ startX: 10, startY: 20, endX: 100, endY: 200, color: '#EF4444', strokeWidth: 2, headSize: 12, style: 'single' }`
- **那么** LeaferArrowAdapter 创建 Leafer Arrow 元素，设置 points、stroke、strokeWidth、arrow 样式

#### 场景:双箭头样式
- **当** ArrowShape.style 为 'double'
- **那么** Arrow 元素两端都显示箭头头部

### 需求:LeaferJS 矩形图形适配器
系统必须提供 `LeaferRectAdapter` 实现 `IShapeAdapter<RectShape>`，使用 Leafer Rect 元素渲染矩形标注。矩形必须支持实线/虚线边框和填充透明度。

#### 场景:创建矩形
- **当** Store 新增 RectShape `{ x: 50, y: 50, width: 200, height: 100, color: '#EF4444', strokeWidth: 2, fillOpacity: 0, borderStyle: 'solid' }`
- **那么** LeaferRectAdapter 创建 Leafer Rect 元素，设置 stroke、strokeWidth、fill、dash 属性

#### 场景:虚线矩形
- **当** RectShape.borderStyle 为 'dashed'
- **那么** Rect 元素的 strokeDash 属性设置为 [8, 4]

### 需求:LeaferJS 文字图形适配器
系统必须提供 `LeaferTextAdapter` 实现 `IShapeAdapter<TextShape>`，使用 Leafer Text 元素渲染文字标注。文字必须支持粗体/斜体样式和字号调整。

#### 场景:创建文字
- **当** Store 新增 TextShape `{ x: 100, y: 100, text: 'Hello', color: '#EF4444', fontSize: 24, fontWeight: 'bold', fontStyle: 'normal' }`
- **那么** LeaferTextAdapter 创建 Leafer Text 元素，设置 fill、fontSize、fontWeight、fontStyle 属性

### 需求:LeaferJS 马赛克自定义滤镜
系统必须通过 `@leafer-in/filter` 插件注册自定义马赛克滤镜 `MosaicFilter`，使用像素块平均色算法实现马赛克效果。马赛克必须支持 blockSize（5-50）和 opacity（0-100）参数。

#### 场景:创建马赛克
- **当** Store 新增 MosaicShape `{ x: 50, y: 50, width: 200, height: 100, blockSize: 10, opacity: 100 }`
- **那么** LeaferMosaicAdapter 创建应用了 MosaicFilter 的 Leafer Image 元素

#### 场景:马赛克 opacity 初始值
- **当** 创建新马赛克
- **那么** opacity 必须 为 100（完全不透明），禁止为 1

### 需求:LeaferJS 裁剪框覆盖层
系统必须实现 `CropOverlay` 自定义元素，提供裁剪框的绘制、拖拽调整、三分线显示功能。裁剪框必须限制在图片边界内。

#### 场景:绘制裁剪框
- **当** 用户在 crop 工具下拖拽绘制裁剪区域
- **那么** CropOverlay 显示半透明遮罩 + 裁剪区域 + 三分线 + 8 个控制点

#### 场景:调整裁剪框
- **当** 用户拖拽裁剪框控制点
- **那么** 裁剪区域实时更新，且不超出图片边界

### 需求:LeaferJS 图形边界约束
系统必须确保所有标注图形（箭头/矩形/文字/马赛克）在绘制、拖拽、视觉渲染三个层面都不超出图片边界。实现方式：Box 容器 `overflow: 'hide'`（视觉裁剪兜底）+ 图形 `dragBounds: 'parent'`（拖拽限制）+ 绘制时坐标钳制（数据层面保证）。

#### 场景:标注容器边界裁剪
- **当** LeaferBackend 初始化
- **那么** 创建与图片同尺寸的 Box 容器（`overflow: 'hide'`），所有标注图形添加到此容器内，超出图片边界的部分不可见

#### 场景:绘制时坐标钳制
- **当** 用户拖拽绘制图形时鼠标移出图片范围
- **那么** 绘制坐标必须钳制到 `[0, imageWidth]` × `[0, imageHeight]` 范围内，Store 中的图形数据坐标不超出图片范围

#### 场景:拖拽限制在图片内
- **当** 用户拖拽移动图形时
- **那么** 图形通过 `dragBounds: 'parent'` 自动限制在图片边界内，禁止拖出图片

#### 场景:缩放控制点不超出图片
- **当** 用户通过控制点缩放图形时
- **那么** 缩放后的图形尺寸和位置不超出图片边界

### 需求:LeaferJS Editor 插件集成
系统必须集成 `@leafer-in/editor` 插件，提供图形的选中、拖拽移动、控制点缩放功能。Editor 必须与 Store 选中状态双向同步。

#### 场景:选中图形
- **当** 用户点击 Leafer Canvas 上的图形
- **那么** Editor 选中该图形，显示 8 个控制点 + 旋转手柄，并通过 onSelectionChange 回调通知业务层

#### 场景:拖拽移动图形
- **当** 用户拖拽选中的图形
- **那么** 图形实时移动，拖拽结束后通过 onShapeChange 回调更新 Store，且图形位置不超出图片边界

#### 场景:控制点缩放图形
- **当** 用户拖拽控制点
- **那么** 图形实时缩放，缩放结束后更新 Store，且缩放后的图形不超出图片边界

### 需求:LeaferJS Viewport 插件集成
系统必须集成 `@leafer-in/viewport` 插件，提供画布的缩放和平移功能。Viewport 状态必须与 Store 的 scale/offset 同步。

#### 场景:滚轮缩放
- **当** 用户滚动鼠标滚轮
- **那么** 画布以鼠标位置为中心缩放，并通过 onViewportChange 回调更新 Store

#### 场景:move 工具平移
- **当** 用户在 move 工具下拖拽画布
- **那么** 画布平移，并通过 onViewportChange 回调更新 Store

### 需求:LeaferJS Export 插件集成
系统必须集成 `@leafer-in/export` 插件，提供标注层的 PNG/JPG/WebP 导出功能。

#### 场景:导出标注层
- **当** 业务层调用 `backend.exportAnnotationLayer({ format: 'png', pixelRatio: 2 })`
- **那么** 返回标注层的 PNG Blob（2 倍分辨率）

#### 场景:分层导出合成
- **当** 用户点击导出按钮
- **那么** 系统分别导出帧容器（snapdom）和标注层（Leafer Export），合成后生成最终图片
