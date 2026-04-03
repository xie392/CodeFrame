## 1. 类型扩展

- [x] 1.1 扩展 `OperationHistory` 类型定义 (`src/shared/types.ts`)
  - Editor: 添加 `frameSettings` 字段（不包含 `scale`/`offset`）
  - CodeGen: 添加 `padding` 字段

## 2. Editor 模块实现

- [x] 2.1 Editor 启动时根据 `saveOperationHistory` 决定是否恢复配置
- [x] 2.2 Editor 用户操作时保存配置到 `operationHistory.editor`
  - 工具切换 (`activeTool`)
  - Frame 设置 (`frameSettings`)
  - 折叠面板状态 (`collapsedSections`)
  - 注意：`scale` 和 `offset` 不保存，它们是视图运行时状态
- [x] 2.3 `saveOperationHistory` 关闭时使用默认配置

## 3. CodeGen 模块实现

- [x] 3.1 CodeGen 启动时根据 `saveOperationHistory` 决定是否恢复配置
- [x] 3.2 CodeGen 用户操作时保存配置到 `operationHistory.codegen`
  - 主题 (`selectedTheme`)
  - 背景 (`selectedBg`)
  - 字体类型 (`selectedFont`)
  - 字体大小 (`fontSize`)
  - 行号显示 (`showLineNumbers`)
  - 内边距 (`padding`)
  - 圆角设置 (`borderRadius`)
  - 阴影开关 (`shadowEnabled`)
  - 阴影强度 (`shadowIntensity`)
  - 标题栏显示 (`showHeader`)
  - 文件名 (`fileName`)
  - 水印开关 (`watermarkEnabled`)
  - 水印文字 (`watermarkText`)
  - 水印透明度 (`watermarkOpacity`)
- [x] 3.3 `saveOperationHistory` 关闭时使用默认配置

## 4. 验证

- [x] 4.1 测试 Editor 配置恢复功能
- [x] 4.2 测试 CodeGen 配置恢复功能
- [x] 4.3 测试开关切换功能
