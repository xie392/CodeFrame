## 上下文

CodeGen 页面当前使用左右分栏布局：
- 左侧：360px 固定面板，包含 CodeMirror 编辑器、主题选择、背景选择
- 右侧：flex-1 预览区域，背景色占满，代码窗口固定居中 520×380px

用户希望改造为：
- **Carbon 视觉风格 + Figma 画布交互**：保留 Carbon 的简洁代码窗口、毛玻璃面板、渐变背景
- **画布区域**：类似 Figma 的无限画布，可缩放、拖动，代码窗口悬浮在画布中
- **左侧配置面板**：窄化至 240px，仅保留主题、背景、导出控制，移除代码编辑器
- **编辑方式**：点击代码窗口直接进入编辑，而非左侧分离编辑器
- **窗口尺寸**：默认 520×380px，允许用户调整大小
- **背景选择**：保留现有的 5 个背景色选择

## 目标 / 非目标

### 目标
- 实现类似 Figma 的画布交互（缩放 25%-200%、平移拖动）
- 代码窗口悬浮在画布中，不与画布边界绑定
- 双击代码窗口直接编辑代码，编辑完成后自动渲染高亮
- 画布背景色可配置（深色渐变背景）
- 平滑的动画过渡体验

### 非目标
- 不支持多画布或多窗口（v1 阶段）
- 不支持画布网格对齐（v2 考虑）
- 不支持画布历史记录/撤销（v2 考虑）
- 不替换现有的 Shiki 高亮方案

## 决策

### 决策 1：使用 @use-gesture/react + @react-spring/web

**选择**：采用 `use-gesture` 手势库配合 `react-spring` 动画库

**原因**：
- `use-gesture` 封装了 wheel、drag、pinch 手势，API 简洁
- `react-spring` 提供平滑的 spring 动画，缩放/拖动更自然
- 两者配合成熟，社区方案验证
- 避免自己实现手势逻辑，减少复杂度

**替代方案考虑**：
- 纯 CSS transform + 原生事件：需要处理大量边界情况，复杂度高
- 仅使用 react-zoom-pan-pinch：API 不够灵活，自定义难度大

### 决策 2：画布坐标系统

**选择**：以画布中心为原点 (0, 0)，代码窗口相对坐标存储

**原因**：
- 缩放时窗口保持相对位置，体验自然
- 便于后续扩展多窗口时统一管理
- 重置视图时可简单归零坐标

**数据结构**：
```typescript
interface CanvasState {
  scale: number;      // 0.25 - 2.0
  position: { x: number; y: number };  // 画布偏移量
}

interface CodeWindowState {
  x: number;          // 相对画布中心的 X 偏移
  y: number;          // 相对画布中心的 Y 偏移
  width: number;      // 窗口宽度（默认 520）
  height: number;     // 窗口高度（自适应或固定）
  isEditing: boolean; // 是否处于编辑模式
}
```

### 决策 3：编辑模式切换

**选择**：**单击**代码窗口进入编辑模式，显示 CodeMirror 覆盖层

**原因**：
- 用户确认单击即可进入编辑，操作更直接
- 保留 Carbon 的视觉效果，编辑时无缝切换
- 避免左侧长期占用空间

**交互流程**：
1. 正常模式：显示 Shiki 高亮结果（只读）
2. 单击：切换为编辑模式，显示 CodeMirror 编辑器
3. 失焦/按 Esc/点击外部：退出编辑模式，保存内容
4. 画布拖动：按住 Space 键或画布空白处拖拽

### 决策 4：窗口尺寸调整

**选择**：默认 520×380px，允许用户调整大小

**原因**：
- 默认值符合 Carbon 风格截图尺寸
- 用户可自定义适应不同代码长度
- 增强灵活性，适配更多场景

**实现方式**：
- 右下角拖拽手柄 (16×16px)
- 最小尺寸限制：320×200px
- 最大尺寸限制：1200×800px
- 调整时实时更新，松开时完成

### 决策 4：画布背景实现

**选择**：使用 CSS 渐变背景 + 网格点图案（可选）

**原因**：
- 渐变背景营造深度感，符合设计工具风格
- 网格点作为视觉参考，帮助用户感知画布位置
- 纯 CSS 实现，性能优秀

**样式参数**：
```css
.canvas-background {
  background: 
    radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%),
    radial-gradient(circle, #333 1px, transparent 1px) 0 0 / 20px 20px;
  background-color: var(--canvas-bg-color, #0D0D18);
}
```

## 风险 / 权衡

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 手势冲突（画布拖动 vs 代码选择）| 高 | 编辑模式下禁用画布拖动，正常模式下代码区域阻止事件冒泡 |
| 性能问题（大代码文件渲染）| 中 | 虚拟滚动优化，延迟渲染非可视区域 |
| 移动端触摸支持 | 中 | 手势库天然支持 touch，需额外测试 pinch 缩放 |
| 导出图片坐标计算复杂 | 中 | 导出时临时重置画布变换，使用 html-to-image 捕获 |

## 组件架构

```
App.tsx
├── LeftPanel (240px, 简化配置)
│   ├── LanguageSelector      # 语言选择下拉
│   ├── ThemeSelector         # 主题选择
│   ├── BackgroundSelector    # 画布背景选择
│   └── ExportButton          # 导出按钮
├── CanvasContainer (flex-1)
│   ├── CanvasBackground (渐变 + 网格)
│   ├── TransformLayer (缩放/平移层)
│   │   └── CodeWindow (可拖动)
│   │       ├── WindowHeader (拖动手柄)
│   │       ├── WindowBody
│   │       │   ├── ShikiHighlight (正常模式)
│   │       │   └── CodeMirrorEditor (编辑模式)
│   │       └── ResizeHandle (右下角调整大小)
│   └── CanvasControls (缩放控制条 - 浮层)
│       ├── ZoomOutBtn
│       ├── ZoomSlider
│       ├── ZoomInBtn
│       ├── ZoomText (100%)
│       └── ResetBtn
└── useCanvas hook (状态管理)
```
App.tsx
├── LeftPanel (240px, 简化配置)
│   ├── ThemeSelector
│   ├── BackgroundSelector
│   └── ExportButton
├── CanvasContainer (flex-1)
│   ├── CanvasBackground (渐变 + 网格)
│   ├── TransformLayer (缩放/平移层)
│   │   └── CodeWindow (可拖动)
│   │       ├── WindowHeader (拖动手柄)
│   │       ├── WindowBody
│   │       │   ├── ShikiHighlight (正常模式)
│   │       │   └── CodeMirrorEditor (编辑模式)
│   │       └── ResizeHandle (右下角)
│   └── CanvasControls (右下角悬浮)
│       ├── ZoomOutBtn
│       ├── ZoomText (100%)
│       ├── ZoomInBtn
│       └── ResetBtn
└── useCanvas hook (状态管理)
```

## 迁移计划

### 实施步骤
1. 创建画布容器组件和 hooks
2. 改造代码窗口支持编辑模式切换
3. 移除左侧 CodeMirror 编辑器
4. 添加画布控制 UI
5. 调整导出逻辑适配新坐标系统

### 回滚策略
- 保留 git 历史，可快速回退到旧布局
- 关键变更分 commit 提交，便于部分回滚
