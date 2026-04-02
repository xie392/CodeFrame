## 上下文

本次变更仅为 Editor 图片容器设置添加 UI 控件，不实现功能逻辑。功能逻辑将在后续提案中单独实现。

## 目标 / 非目标

### 目标

- 在属性面板添加完整的容器设置 UI
- UI 风格与现有属性面板一致
- 为后续功能实现预留接口

### 非目标

- 不实现实际的容器效果渲染
- 不实现导出时的容器效果
- 不实现撤销/恢复功能

## UI 布局设计

```
┌─────────────────────────────────────┐
│ // properties                       │
├─────────────────────────────────────┤
│ [position]                          │
│   x, y, w, h                        │
├─────────────────────────────────────┤
│ [frame]  ← 新增区域                 │
│   ▼ background                      │
│     type: [solid ▼]                 │
│     color: [▓▓▓] #FFFFFF            │
│     presets: ░░ ▒▒ ▓▓               │
│   ▼ padding                         │
│     [linked 🔗] t: [0] r: [0]       │
│                  b: [0] l: [0]       │
│   ▼ border-radius                   │
│     [linked 🔗] ━━━━━○━━ 8px         │
│   ▼ shadow                          │
│     [toggle]                        │
│     blur: ━━━━━○━━ 20px             │
│     x: [0] y: [10]                  │
│   ▼ aspect-ratio                    │
│     [original ▼]                    │
│   ▼ window-control                  │
│     [toggle] [macOS ▼]              │
│   ▼ watermark                       │
│     [toggle]                        │
│     text: [________________]        │
│     position: [bottom-right ▼]      │
│     opacity: ━━━━━○━━ 50%           │
├─────────────────────────────────────┤
│ $ export_image                      │
│ $ copy_to_clipboard                 │
└─────────────────────────────────────┘
```

## 数据结构（仅 UI 状态）

```typescript
interface ImageFrameSettings {
  background: {
    type: 'solid' | 'linear' | 'radial';
    color: string;
    gradientColors: [string, string];
    gradientAngle: number;
  };
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    linked: boolean;
  };
  borderRadius: {
    value: number;
    linked: boolean;
  };
  shadow: {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  aspectRatio: string;
  windowControl: {
    enabled: boolean;
    style: 'macos' | 'windows';
  };
  watermark: {
    enabled: boolean;
    text: string;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
    opacity: number;
    fontSize: number;
  };
}
```

## 默认值

```typescript
const DEFAULT_FRAME_SETTINGS: ImageFrameSettings = {
  background: {
    type: 'solid',
    color: 'transparent',
    gradientColors: ['#FFFFFF', '#000000'],
    gradientAngle: 135,
  },
  padding: { top: 0, right: 0, bottom: 0, left: 0, linked: true },
  borderRadius: { value: 0, linked: true },
  shadow: { enabled: false, color: '#000000', blur: 20, offsetX: 0, offsetY: 10 },
  aspectRatio: 'original',
  windowControl: { enabled: false, style: 'macos' },
  watermark: { enabled: false, text: '', position: 'bottom-right', opacity: 50, fontSize: 14 },
};
```
