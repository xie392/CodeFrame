## 新增需求

### 需求：Leafer 唯一渲染后端

系统**必须**以 LeaferJS 作为唯一渲染后端，提供完整的标注编辑能力，包括绘制、选中、拖拽、裁剪、导出等。

#### 场景：Leafer 始终启用

- **当** 编辑器初始化
- **那么** 系统**必须**使用 Leafer 渲染路径，不再通过 Feature Flag 切换
- **并且** `isLeaferEnabled()` 调用全部移除，Leafer 始终为 true

#### 场景：绘制后自动选中

- **当** 用户完成一个标注的绘制（mouseup）
- **那么** 系统**必须**自动切换到 select 工具
- **并且** 系统**必须**选中新创建的标注元素
- **并且** 选中的标注**必须**显示选中边框和控制手柄

#### 场景：文字编辑隐藏底层

- **当** 用户双击文字标注进入编辑模式
- **那么** Backend **必须**调用 `setEditingTextId` 隐藏 Leafer Text 元素
- **并且** 浮层输入框**必须**覆盖在原文字位置上
- **当** 用户完成文字编辑（失焦或按 Esc）
- **那么** 系统**必须**恢复 Leafer Text 元素的可见性

---

### 需求：统一编辑器操作 Hook

系统**必须**提供 `useEditorActions` Hook，统一管理 pushHistory/undo/redo 操作，消除 Leafer 和历史记录之间的冗余代码。

#### 场景：共享历史操作

- **当** 任何组件需要执行撤销/重做
- **那么** 系统**必须**通过 `useEditorActions` 获取 `undo`/`redo`/`pushHistory` 方法
- **并且** 这些方法**必须**操作 Store 中的统一历史栈

---

## 修改需求

### 需求：视口管理统一到 Store

useZoomPan **必须**从 Store 读写 scale/offset，Store 作为视口状态的单一真相源。

#### 场景：缩放状态读写

- **当** 用户缩放画布（滚轮或按钮）
- **那么** 系统**必须**将新的 scale 值写入 Store
- **并且** Leafer 渲染层**必须**从 Store 读取 scale 值进行渲染

#### 场景：平移状态读写

- **当** 用户平移画布（空格+拖拽）
- **那么** 系统**必须**将新的 offset 值写入 Store
- **并且** Leafer 渲染层**必须**从 Store 读取 offset 值进行渲染

---

### 需求：Leafer App 初始化

Leafer App **必须**使用显式配置方式初始化，确保 `app.tree` 和 `app.sky` 层正确创建。

#### 场景：App 创建

- **当** LeaferBackend 初始化
- **那么** **必须**使用 `new App({ tree: { type: 'design' }, sky: {} })` 创建 App
- **并且** `app.tree` **必须**作为标注元素容器
- **并且** `app.sky` **必须**作为交互覆盖层（如选区框）

---

### 需求：裁剪交互优化

裁剪工具**必须**在 PointerMove 中只更新视觉，不通知 Store；仅在 PointerUp 时通知 Store 一次，避免卡顿。

#### 场景：裁剪拖拽流畅性

- **当** 用户拖拽裁剪区域边界
- **那么** PointerMove **必须**只更新 CropOverlay 的视觉位置
- **并且** PointerMove **不得**触发 Store 更新或 Backend 同步
- **当** 用户释放鼠标（PointerUp）
- **那么** 系统**必须**通过 `notifyCropChange` 将最终裁剪区域通知 Store

#### 场景：裁剪后保留标注

- **当** 用户确认裁剪
- **那么** 系统**必须**按裁剪区域偏移调整标注坐标（减去 cropOffX/cropOffY）
- **并且** 系统**必须**过滤掉裁剪区域外的标注
- **并且** 系统**不得**无条件清空所有标注

---

### 需求：马赛克渲染

马赛克标注**必须**正确渲染，不得出现黑色背景。

#### 场景：马赛克占位图

- **当** 马赛克标注创建但真实图片未加载
- **那么** MosaicAdapter **必须**设置透明占位 URL
- **并且** 占位图**不得**显示为黑色

#### 场景：马赛克 Filter 重新应用

- **当** 真实图片 URL 更新
- **那么** MosaicFilter **必须**在 URL 更新后重新应用
- **并且** 最终渲染结果**必须**是马赛克化的真实图片

---

### 需求：工具栏简化

工具栏**不得**显示 move（移动）工具按钮，拖拽已通过空格+鼠标实现。

#### 场景：工具栏按钮

- **当** 用户查看工具栏
- **那么** 工具栏**必须**显示：select、arrow、rect、ellipse、text、mosaic、crop
- **并且** 工具栏**不得**显示 move 按钮

---

### 需求：Chrome 扩展快捷键

Leafer 路径**必须**支持 Chrome 扩展快捷键，功能与原 Canvas2D 路径对齐。

#### 场景：快捷键绑定

- **当** 编辑器在 Chrome 扩展环境运行
- **那么** 系统**必须**响应所有已注册的 Chrome 扩展快捷键
- **并且** 快捷键行为**必须**与原 Canvas2D 路径一致

---

## 移除需求

### 需求：Canvas2D 渲染路径

**原因**：统一为 Leafer 单路径，消除双路径冗余和同步问题。Canvas2D 路径代码完全移除，无法通过 Feature Flag 回退。

**涉及文件**：
- Canvas2DCanvas 组件
- CanvasRenderer 服务
- FrameContainer 组件
- useEditorEvents Hook
- useExport Hook
- useShapeDragging Hook
- useShapeDrawing Hook
- useMarqueeSelection Hook
- 及其对应测试文件

---

### 需求：Feature Flag 切换机制

**原因**：Leafer 已成为唯一渲染路径，不再需要 Feature Flag 切换。

**涉及文件**：
- feature-flag.ts
- feature-flag.test.ts

---

### 需求：useLeaferHistory Hook

**原因**：历史记录功能合并到统一的 useEditorActions Hook，不再需要 Leafer 专有的历史 Hook。

**涉及文件**：
- useLeaferHistory.ts
