## 上下文

CodeFrame 编辑器当前使用原生 Canvas 2D API 手写渲染层（~2400 行），此前有过 Konva.js 迁移失败被回退的经历。失败原因分析：

1. **一次性替换** — 尝试将整个 Canvas 层替换为 Konva，无法逐步验证
2. **无隔离层** — 业务代码直接依赖 Konva API，回退时牵一发动全身
3. **Store 结构变更** — 同时修改了数据模型，增加了迁移复杂度

当前状态：
- 编辑器三栏布局（Toolbar | Canvas | PropertiesPanel）稳定
- Zustand Store 管理所有图形数据（arrows/rects/texts/mosaics）和选中状态
- 帧容器（FrameContainer）用 CSS 渲染背景/圆角/阴影/水印，与 Canvas 标注层分离
- 导出管线：CanvasRenderer 绘制标注 → 转 `<img>` 叠加到 DOM → snapdom 截取 DOM
- 已有死代码：useShapeDrawing/useShapeDragging/useMarqueeSelection（~790 行）

LeaferJS 适配性评估：
- Editor 插件：选中/拖拽/缩放/旋转/框选 — 内置
- Arrow 插件：12 种箭头样式 — 内置
- Viewport 插件：缩放/平移 — 内置
- Export 插件：PNG/JPG/WebP — 内置
- Filter 插件：自定义滤镜（马赛克）— 需开发
- 裁剪框 — 需开发
- React 集成：无声明式组件，用 useEffect + useRef
- 包体积：核心 66KB + 插件 ~100KB gzip

## 目标 / 非目标

**目标：**
- 创建渲染后端抽象层，LeaferJS 作为可替换的实现
- 新旧双路径共存，运行时一键切换，随时可回退到 Canvas 2D
- 分 6 个阶段实施，每个阶段独立验证，不依赖后续阶段
- Store 数据结构不变，通过适配器映射
- 解决现有 Bug（马赛克 opacity、默认样式不一致）作为迁移附带收益

**非目标：**
- 不修改帧容器（FrameContainer）的 CSS 渲染方式
- 不修改 Toolbar / PropertiesPanel 的 UI 逻辑
- 不修改 Store 的数据结构（ArrowShape/RectShape/TextShape/MosaicShape）
- 不引入 React 声明式 Canvas 组件（LeaferJS 无官方支持）
- 不删除现有 Canvas 2D 代码（直到 LeaferJS 路径完全验证通过）

## 决策

### 决策 1：双渲染路径 + 抽象接口层

**选择**：定义 `IRendererBackend` 接口，Canvas2D 和 LeaferJS 各自实现

**理由**：之前 Konva 迁移失败的核心原因是业务代码直接依赖渲染 API。抽象层确保：
- App.tsx 不感知底层实现
- 切换渲染器只需更换 Backend 实例
- 回退成本为零（切换 flag 即可）

**替代方案**：
- A) 直接替换：高风险，与 Konva 迁移同路径 → ❌
- B) 分支开发：无法实时对比验证 → ❌
- C) 抽象层 + 双路径：可实时切换、实时对比 → ✅

```
┌───────────────────────────────────────┐
│  App.tsx / Toolbar / PropertiesPanel  │
│         ↕ 只依赖 Store + 接口          │
├───────────────────────────────────────┤
│          useBackendSync               │
│     (Store ↔ IRendererBackend)        │
├──────────────┬────────────────────────┤
│  Canvas2D    │  LeaferJS              │
│  Backend     │  Backend               │
│  (现有代码)   │  (新实现)              │
└──────────────┴────────────────────────┘
```

### 决策 2：Store 数据结构不变，用适配器映射

**选择**：保持 ArrowShape/RectShape/TextShape/MosaicShape 类型不变，每个图形类型对应一个 `IShapeAdapter` 负责双向转换

**理由**：
- Store 是整个编辑器的数据中枢，修改牵扯面太大
- 适配器模式将渲染引擎差异隔离在适配器内部
- 回退时只需移除 Leafer 适配器，Store 层无感知

**数据流**：
```
Store (ArrowShape) → ArrowAdapter.toCreateParams() → Leafer Arrow
Leafer Arrow 属性变化 → ArrowAdapter.toStoreUpdates() → Store 更新
```

### 决策 3：帧容器保持 CSS 渲染，Leafer Canvas 只管标注层

**选择**：保持 FrameContainer 用 CSS 渲染背景/圆角/阴影，Leafer Canvas 仅负责标注图形层

**理由**：
- 帧容器是纯 CSS 实现且功能完整，无需迁移
- Leafer Canvas 覆盖在帧容器上方，与当前 `<canvas>` 覆盖方式一致
- 坐标系通过 Leafer 的 zoomLayer 对齐到图片坐标系

**叠加关系**：
```
<main> (Canvas flex-1)
  ├── <div> (transform: translate + scale)    ← 缩放平移容器
  │   └── FrameContainer                      ← CSS 渲染（不变）
  │       ├── CanvasImage                      ← 图片
  │       └── WatermarkRenderer                ← 水印
  └── <div id="leafer-view">                  ← Leafer Canvas 覆盖层
      └── [Leafer Arrow/Rect/Text/Mosaic]     ← 标注图形
```

### 决策 4：选中状态同步策略 — Store 为唯一真实源

**选择**：Zustand Store 的 selectedXxxIds 始终是选中状态的唯一真实源（Single Source of Truth）

**规则**：
- **用户交互 → Leafer Editor 选中事件 → 写入 Store → 同步到 UI**
- **外部操作（键盘/面板） → 写入 Store → 同步到 Leafer Editor**
- **防循环**：`IEditorBridge.isSyncing()` 守卫防止 Store→Leafer→Store 循环

**理由**：Leafer Editor 内部维护自己的选中状态，如果让它和 Store 双向自由同步，会产生循环更新。Store 为唯一源消除了歧义。

### 决策 5：导出管线 — Leafer Export 替代 snapdom

**选择**：Leafer 路径使用 `@leafer-in/export` 直接导出标注层，与帧容器分开导出后合成

**理由**：
- `leafer.export('png')` 直接获取标注层图片，无需中间 canvas→img→DOM 转换
- 帧容器仍用 snapdom 截取（CSS 渲染用 DOM 截图更准确）
- 合成策略：帧容器截图（底层）+ 标注层导出（上层）= 最终图片

**替代方案**：
- A) 全部用 snapdom：需要将 Leafer canvas 转为 DOM 元素 → 繁琐
- B) 全部用 Leafer export：需要将帧容器 CSS 渲染迁入 Leafer → 改动太大
- C) 分层导出后合成 → ✅ 最小改动

### 决策 7：图形边界约束 — 绘制内容禁止超出图片

**选择**：三层约束机制，确保标注图形在绘制、拖拽、视觉渲染三个层面都不超出图片边界

**具体实现**：

1. **Box 容器 + overflow: 'hide'**（视觉裁剪兜底）
```typescript
// 创建与图片同尺寸的 Box 作为标注容器
const annotationBox = new Box({
  width: imageWidth, height: imageHeight,
  overflow: 'hide',  // 超出部分不渲染
})
app.tree.add(annotationBox)
// 所有标注图形添加到 annotationBox 内
```

2. **dragBounds: 'parent'**（拖拽限制）
```typescript
// 每个图形设置 dragBounds，拖拽时不超出父 Box 边界
const rect = new Rect({ ..., dragBounds: 'parent' })
```

3. **绘制时坐标钳制**（数据层面保证）
```typescript
// LeaferBackend 绘制交互中，坐标钳制到图片范围
const clampedX = Math.max(0, Math.min(imageWidth, coord.x))
const clampedY = Math.max(0, Math.min(imageHeight, coord.y))
```

**理由**：
- 当前实现仅对裁剪框有边界约束，普通图形（箭头/矩形/马赛克）绘制时无坐标钳制
- 用户明确要求绘制内容不能超出图片，需在数据层面和视觉层面双重保证
- Box + overflow 是零成本兜底，即使数据有溢出也不会在视觉上体现
- dragBounds: 'parent' 确保拖拽操作自动限制在图片内
- 坐标钳制确保 Store 中的数据坐标不超出图片范围，导出时无溢出

**叠加关系（更新）**：
```
<main> (Canvas flex-1)
  ├── <div> (transform: translate + scale)    ← 缩放平移容器
  │   └── FrameContainer                      ← CSS 渲染（不变）
  │       ├── CanvasImage                      ← 图片
  │       └── WatermarkRenderer                ← 水印
  └── <div id="leafer-view">                  ← Leafer Canvas 覆盖层
      └── Box (overflow: 'hide', w=imgW, h=imgH) ← 标注容器（边界约束）
          ├── Arrow (dragBounds: 'parent')     ← 箭头
          ├── Rect (dragBounds: 'parent')      ← 矩形
          ├── Text (dragBounds: 'parent')      ← 文字
          └── MosaicImage (dragBounds: 'parent') ← 马赛克
```

### 决策 6：运行时 Feature Flag

**选择**：URL 参数 `?leafer=true` + localStorage `codeframe_use_leafer` 双重切换

**理由**：
- URL 参数便于 A/B 对比测试（同一页面两个标签页）
- localStorage 持久化用户偏好
- 默认关闭，Leafer 路径需主动启用
- 无需重新构建，零回退成本

## 风险 / 权衡

### [风险 1] LeaferJS 社区极小（npm 周下载 ~1.6K）→ 遇坑只能看源码

**缓解**：
- 抽象层确保不深度绑定 LeaferJS API，最坏情况可替换为其他引擎
- LeaferJS 源码是 TypeScript，可读性高
- 竞品 ShotEasy 已在同类产品中验证核心场景

### [风险 2] 马赛克效果需自定义 Filter，可能性能不达标

**缓解**：
- 马赛克 Filter 的 `apply()` 方法获取原生 Canvas 上下文，与当前实现等价
- Phase 2 单独验证马赛克性能，不达标可回退到 Canvas 2D 仅对马赛克渲染
- 备选方案：使用 Leafer 的 `Canvas` 元素嵌入离屏 canvas 做像素操作

### [风险 3] Leafer Canvas 与 CSS 帧容器坐标对齐问题

**缓解**：
- 帧容器和 Leafer Canvas 共享同一个缩放平移容器（`transform` 属性）
- Leafer 的 zoomLayer 设置与 CSS transform 保持一致
- Phase 0 即验证坐标对齐，如有偏差立即暴露

### [风险 4] 选中状态同步循环 → 无限重渲染

**缓解**：
- `IEditorBridge.isSyncing()` 守卫
- Store → Leafer 同步时设置 syncing flag
- Leafer 事件回调中检查 flag，syncing 期间不回写 Store

### [风险 5] 导出质量差异 — Leafer Export vs snapdom

**缓解**：
- Phase 4 单独对比导出质量
- 像素级比对测试（Leafer 导出 vs Canvas 2D 导出）
- 帧容器仍用 snapdom，仅标注层切换为 Leafer Export

### [权衡] 双路径维护成本

- 短期：双路径并存增加代码量
- 长期：Canvas 2D 路径标记为 deprecated，Leafer 验证通过后删除
- 期间：Canvas 2D 路径只修 Bug，不新增功能
