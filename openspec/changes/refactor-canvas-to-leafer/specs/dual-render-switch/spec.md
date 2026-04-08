## 新增需求

### 需求:运行时渲染路径切换
系统必须支持运行时在 Canvas 2D 和 LeaferJS 渲染路径之间切换，无需重新构建应用。切换方式为 URL 参数 `?leafer=true` 或 localStorage `codeframe_use_leafer=true`。

#### 场景:URL 参数切换
- **当** 用户访问编辑器页面并添加 URL 参数 `?leafer=true`
- **那么** 编辑器使用 LeaferJS 渲染路径

#### 场景:默认渲染路径
- **当** 用户访问编辑器页面无 URL 参数且 localStorage 未设置
- **那么** 编辑器使用 Canvas 2D 渲染路径（安全回退）

#### 场景:localStorage 持久化
- **当** 用户设置 `localStorage.setItem('codeframe_use_leafer', 'true')`
- **那么** 后续访问编辑器默认使用 LeaferJS 渲染路径

### 需求:Canvas2D 渲染路径封装
系统必须将现有 Canvas 2D 渲染逻辑封装为 `Canvas2DCanvas` 组件，实现 `IRendererBackend` 接口。封装过程禁止修改现有 Canvas 2D 代码的功能行为。

#### 场景:Canvas2DCanvas 组件渲染
- **当** 渲染路径选择为 Canvas 2D
- **那么** Canvas2DCanvas 组件渲染 `<canvas>` 元素，使用现有 useEditorEvents + CanvasRenderer + useZoomPan 逻辑

#### 场景:Canvas2D 路径功能完整
- **当** 使用 Canvas 2D 渲染路径
- **那么** 所有编辑器功能（箭头/矩形/文字/马赛克/裁剪/导出/撤销重做）必须与当前版本行为完全一致

### 需求:LeaferJS 渲染路径组件
系统必须提供 `LeaferCanvas` 组件作为 LeaferJS 渲染路径的入口，内部使用 `useBackendSync` 与 Store 同步。

#### 场景:LeaferCanvas 组件渲染
- **当** 渲染路径选择为 LeaferJS
- **那么** LeaferCanvas 组件创建 Leafer App 实例，挂载到容器 DOM，初始化 Editor/Viewport 插件

#### 场景:LeaferCanvas 组件卸载
- **当** 组件卸载或切换回 Canvas 2D 路径
- **那么** LeaferCanvas 销毁 Leafer App 实例，清理所有资源
