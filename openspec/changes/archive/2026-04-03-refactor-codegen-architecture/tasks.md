## 1. 基础设施准备

- [x] 1.1 创建 `src/codegen/components/` 目录
- [x] 1.2 创建 `src/codegen/hooks/` 目录
- [x] 1.3 创建 `src/codegen/stores/` 目录
- [x] 1.4 创建 `src/codegen/utils/` 目录
- [x] 1.5 创建 `src/codegen/constants.ts` 常量文件

## 2. 提取工具函数和常量

- [x] 2.1 提取 `calcAutoHeight` 到 `utils/layout.ts`
- [x] 2.2 提取 `isUniformPadding` 到 `utils/layout.ts`
- [x] 2.3 提取魔法数字到 `constants.ts`（LINE_HEIGHT_OFFSET、ZOOM_FACTOR 等）
- [x] 2.4 提取 DEFAULT_CODE 到 `constants.ts`
- [x] 2.5 提取 FONT_OPTIONS 到 `constants.ts`

## 3. 创建 Zustand Store

- [x] 3.1 创建 `stores/codegen-store.ts`
- [x] 3.2 定义 ThemeState 接口（selectedTheme, selectedBg, customBgColor）
- [x] 3.3 定义 WindowState 接口（padding, borderRadius, shadow, showHeader, fileName）
- [x] 3.4 定义 EditorState 接口（showLineNumbers, selectedFont, fontSize）
- [x] 3.5 定义 WatermarkState 接口（enabled, text, opacity）
- [x] 3.6 实现 setTheme/setWindow/setEditor/setWatermark actions
- [x] 3.7 集成操作历史保存逻辑

## 4. 创建自定义 Hooks

- [x] 4.1 创建 `hooks/useCurrent.ts` 替代 Ref 同步 useEffect
- [x] 4.2 创建 `hooks/useCanvasTransform.ts`（缩放/平移逻辑）
- [x] 4.3 创建 `hooks/useWindowState.ts`（窗口尺寸/编辑状态）
- [x] 4.4 创建 `hooks/useExport.ts`（导出/复制功能）
- [x] 4.5 创建 `hooks/useOperationHistory.ts`（历史恢复逻辑）

## 5. 提取组件

### 5.1 LeftPanel 组件

- [x] 5.1.1 创建 `components/LeftPanel.tsx`
- [x] 5.1.2 迁移主题选择区域
- [x] 5.1.3 迁移背景色选择区域
- [x] 5.1.4 迁移 Padding 控制区域
- [x] 5.1.5 迁移窗口视觉控制区域
- [x] 5.1.6 迁移圆角控制区域
- [x] 5.1.7 迁移字体选择区域
- [x] 5.1.8 迁移水印控制区域
- [x] 5.1.9 迁移导出按钮区域

### 5.2 CanvasArea 组件

- [x] 5.2.1 创建 `components/CanvasArea.tsx`
- [x] 5.2.2 迁移画布容器和背景
- [x] 5.2.3 迁移变换层逻辑
- [x] 5.2.4 集成 CodeWindow 组件

### 5.3 CodeWindow 组件

- [x] 5.3.1 创建 `components/CodeWindow.tsx`
- [x] 5.3.2 迁移窗口容器样式
- [x] 5.3.3 迁移 WindowHeader（标题栏）
- [x] 5.3.4 迁移 WindowBody（CodeMirror 编辑器）
- [x] 5.3.5 迁移 Resize Handle
- [x] 5.3.6 迁移水印渲染

### 5.4 ZoomControls 组件

- [x] 5.4.1 创建 `components/ZoomControls.tsx`
- [x] 5.4.2 迁移缩放按钮
- [x] 5.4.3 迁移缩放滑块
- [x] 5.4.4 迁移重置按钮

## 6. 重构主组件

- [x] 6.1 更新 `App.tsx` 使用新组件
- [x] 6.2 更新 `App.tsx` 使用 Zustand store
- [x] 6.3 更新 `App.tsx` 使用自定义 hooks
- [x] 6.4 移除冗余代码和 useEffect

## 7. 代码优化

- [x] 7.1 提取内联样式对象为常量
- [x] 7.2 添加输入验证（fileName、watermarkText、customBgColor）
- [x] 7.3 修复 useCallback 依赖数组
- [x] 7.4 添加错误边界处理
- [x] 7.5 优化 console.error 输出

## 8. 测试验证

- [x] 8.1 为 useCurrent hook 编写单元测试
- [x] 8.2 为 useCanvasTransform hook 编写单元测试
- [x] 8.3 为 useExport hook 编写单元测试
- [x] 8.4 为 Zustand store 编写单元测试
- [x] 8.5 运行现有 E2E 测试验证功能完整性
- [x] 8.6 手动测试所有交互功能

## 验收标准

- [x] App.tsx 行数 ≤ 150 行 ✓ (实际: 91 行)
- [x] 所有单元测试通过 ✓
- [x] E2E 测试通过 ✓
- [x] 无 TypeScript 类型错误 ✓
- [x] 无 ESLint 警告 ✓
- [x] 功能与重构前完全一致 ✓
