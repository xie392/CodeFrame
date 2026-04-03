## 1. 集成简单 Hooks

- [x] 1.1 集成 `useKeyboardShortcuts` Hook
  - 添加 import
  - 创建 callbacks 对象
  - 替换键盘事件处理 useEffect
  - 运行测试验证
- [x] 1.2 集成 `useCrop` Hook
  - 创建 config 和 callbacks
  - 替换 applyCrop 和 cancelCrop 函数
  - 运行测试验证
- [x] 1.3 集成 `useTextEditing` Hook
  - 创建状态和回调
  - 替换文字编辑相关代码
  - 运行测试验证

## 2. 集成复杂 Hooks

- [x] 2.1 集成 `useShapeDrawing` Hook
  - 创建 config 对象
  - 替换绘制状态 Refs
  - 替换绘制开始/更新/完成逻辑
  - 运行测试验证
- [x] 2.2 集成 `useShapeDragging` Hook
  - 创建 config 和 callbacks
  - 使用 applyDragResize 简化代码
  - 替换拖拽处理逻辑
  - 运行测试验证
- [x] 2.3 集成 `useMarqueeSelection` Hook
  - 创建 config 和 callbacks
  - 替换框选逻辑
  - 运行测试验证

## 3. 提取渲染组件

- [x] 3.1 创建 `FrameContainer` 组件
  - 提取帧容器渲染逻辑
  - 处理 background/padding/borderRadius 样式
  - 添加单元测试
- [x] 3.2 创建 `TextEditorInput` 组件
  - 提取文字编辑输入框
  - 接收 editingText 状态
  - 添加单元测试
- [x] 3.3 创建 `CropHint` 组件
  - 提取裁剪提示 UI
  - 添加国际化支持
  - 添加单元测试
- [x] 3.4 创建 `ZoomControls` 组件
  - 提取缩放控制条
  - 接收 zoomIn/zoomOut/resetView 回调
  - 添加单元测试

## 4. 优化事件监听器

- [x] 4.1 使用 ref 稳定事件监听器
  - 创建 onDownRef/onMoveRef/onUpRef
  - 减少 useEffect 依赖项
  - 运行测试验证

## 5. 清理和验证

- [x] 5.1 移除冗余代码
  - 清理未使用的导入
  - 移除注释掉的代码
  - 统一代码风格
- [x] 5.2 运行完整测试
  - npm test (147 个测试全部通过)
  - npm run build (构建成功)
- [x] 5.3 验证行数
  - wc -l src/editor/App.tsx (当前 493 行)
  - 目标 < 500 行 ✅
- [x] 5.4 功能验证
  - 手动测试所有编辑功能
  - 验证键盘快捷键
  - 验证导出功能

---

## 最终成果

**行数变化**:
| 阶段 | App.tsx 行数 | 变化 |
|------|-------------|------|
| 初始 | 2,187 行 | - |
| 最终 | **493 行** | **-1,694 行 (-77.5%)** |

**新增文件**:

| 文件 | 行数 | 用途 |
|------|------|------|
| `hooks/useEditorEvents.ts` | 760 行 | 统一事件处理 Hook |
| `hooks/useEditorInit.ts` | 137 行 | 初始化逻辑 Hook |
| `components/FrameContainer/index.tsx` | 130 行 | 帧容器组件 |
| `components/TextEditorInput/index.tsx` | 89 行 | 文字编辑输入组件 |
| `components/CropHint/index.tsx` | 48 行 | 裁剪提示组件 |
| `components/ZoomControls/index.tsx` | 91 行 | 缩放控制组件 |
| `utils/validation.ts` | 23 行 | 验证工具函数 |

**验证结果**:
- 测试状态：147/147 通过 ✅
- 构建状态：成功 ✅
- 行数目标：< 500 行 ✅ (实际 493 行)

**架构改进**:
```
App.tsx (493 行)
├── Store 状态管理
├── Refs 管理
├── useZoomPan Hook (缩放/平移)
├── useEditorHistory Hook (历史记录)
├── useCrop Hook (裁剪功能)
├── useTextEditing Hook (文字编辑)
├── useKeyboardShortcuts Hook (键盘快捷键)
├── useEditorEvents Hook (统一事件处理)
├── useEditorInit Hook (初始化逻辑)
├── useExport Hook (导出功能)
└── 渲染组件
    ├── FrameContainer
    ├── TextEditorInput
    ├── CropHint
    └── ZoomControls
```
