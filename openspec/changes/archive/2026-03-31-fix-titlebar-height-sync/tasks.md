## 1. 实施
- [x] 1.1 修复 `useEffect`（`App.tsx:512-520`）：移除 `isEditing` 前置条件，使 `showHeader` 变化时无论是否处于编辑模式都能触发高度重算
- [x] 1.2 手动验证：关闭 title_bar → 点击编辑器 → 退出编辑 → 开启 title_bar → 确认高度自动恢复且代码不截断
