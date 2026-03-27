# 变更：重新设计 UI 为现代科技风格

## 为什么

当前 Terminal Minimal 风格虽然独特，但存在以下问题：
1. **视觉层次不够分明** - 纯黑色背景缺乏深度感
2. **颜色单一** - 只使用绿色作为强调色，缺乏视觉吸引力
3. **卡片样式平淡** - 缺少现代 UI 的精致感

基于 `ui-ux-pro-max` 搜索结果，推荐使用 **Bento Grid + Glassmorphism** 混合风格，这是现代开发者工具的最佳实践。

## 变更内容

### 风格选择

基于搜索结果，选择以下风格组合：

| 维度 | 选择 | 来源 |
|------|------|------|
| 主风格 | Bento Box Grid | 产品类型推荐 |
| 辅助风格 | Glassmorphism | 开发者工具推荐 |
| 字体组合 | Space Grotesk + DM Sans | Tech Startup 推荐 |

### 颜色系统更新

```yaml
# Developer Tool 推荐配色
Primary: "#3B82F6"  # 蓝色 - 现代、专业、信任
Secondary: "#1E293B"  # 深灰蓝
CTA: "#2563EB"  # 行动色
Background: "#0F172A"  # 深蓝黑 - 比 #0C0C0C 更有深度
Text: "#F1F5F9"  # 主文字
Border: "#334155"  # 边框

# 增加语义色
Success: "#22C55E"  # 绿色
Warning: "#F59E0B"  # 橙色
Error: "#EF4444"  # 红色
Info: "#06B6D4"  # 青色
```

### 视觉效果

| 元素 | 原设计 | 新设计 |
|------|--------|--------|
| 卡片圆角 | 4px | 12px (rounded-xl) |
| 卡片阴影 | 无 | 柔和阴影 `shadow-lg` |
| 卡片背景 | #171717 | rgba(255,255,255,0.05) + backdrop-blur |
| Hover 效果 | 背景变色 | scale(1.02) + 阴影扩散 |
| 过渡动画 | 无 | 200ms ease |

### 字体系统

```yaml
Heading: Space Grotesk
  - 特点: 独特字符、现代科技感
  - 用途: Logo、标题、按钮

Body: DM Sans
  - 特点: 高可读性、几何美感
  - 用途: 描述、正文、标签
```

## 影响

- 受影响规范：ui/spec.md（修改）
- 受影响文件：
  - `src/styles/globals.css`
  - `tailwind.config.js`
  - `src/popup/App.tsx`
  - `codeframe-ui.pen`
