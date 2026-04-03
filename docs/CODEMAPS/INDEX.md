# CodeFrame 代码地图索引

**最后更新：** 2026-04-03

## 概览

CodeFrame 是一个图片编辑器应用，支持截图标注、图片美化等功能。

## 模块列表

| 模块 | 描述 | 文档 |
|------|------|------|
| Editor | 图片编辑器核心模块 | [editor.md](./editor.md) |

## 架构概览

```
CodeFrame/
├── src/
│   ├── editor/          # 编辑器模块（核心）
│   ├── shared/          # 共享模块
│   │   ├── components/  # 公共组件
│   │   ├── stores/      # 全局状态
│   │   ├── constants/   # 公共常量
│   │   └── types/       # 公共类型
│   └── popup/           # 弹窗页面
├── public/              # 静态资源
├── docs/                # 文档
│   ├── CODEMAPS/        # 代码地图
│   └── designs/         # 设计资源
└── openspec/            # 规范和变更提案
```

## 快速导航

### Editor 模块

**入口点：** `src/editor/App.tsx`

**核心职责：**
- 图片加载和显示
- 图形标注（箭头、矩形、文字、马赛克）
- 裁剪功能
- 图片导出

**关键文件：**

| 文件 | 职责 |
|------|------|
| `store/editor-store.ts` | 状态管理 |
| `services/canvas-renderer.ts` | Canvas 渲染 |
| `hooks/useEditorHistory.ts` | 撤销恢复 |
| `hooks/useExport.ts` | 导出功能 |
| `components/Toolbar/` | 工具栏 |
| `components/PropertiesPanel/` | 属性面板 |

详见 [editor.md](./editor.md)。

## 技术栈

- **框架：** React 19 + TypeScript
- **构建：** Vite
- **状态：** Zustand
- **样式：** Tailwind CSS
- **国际化：** react-i18next

## 相关文档

- [功能设计文档](../03-functional-design-document.md)
- [产品需求文档](../02-product-requirements-document.md)

---

*此索引由代码地图生成系统维护。*
