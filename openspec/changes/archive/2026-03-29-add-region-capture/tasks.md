## 1. 基础设施（消息类型与类型定义）

- [x] 1.1 在 `src/shared/messages.ts` 中新增 `CAPTURE_REGION`、`CANCEL_CAPTURE`、`START_CAPTURE` 消息类型
- [x] 1.2 在 `src/shared/types.ts` 中新增 `RegionRect` 类型 `{ x: number; y: number; width: number; height: number; dpr: number }`
- [x] 1.3 在 `src/shared/constants.ts` 中新增区域截图相关常量（最小选区尺寸、遮罩透明度、边框颜色等）

## 2. Content Script — 区域选择覆盖层

- [x] 2.1 创建 `src/content/overlay.ts`，实现 Shadow DOM 容器创建与销毁
- [x] 2.2 实现全屏半透明遮罩渲染（`position: fixed; inset: 0`）
- [x] 2.3 实现鼠标拖拽事件处理：mousedown → mousemove → mouseup，绘制矩形选区
- [x] 2.4 实现选区外部遮罩效果（box-shadow 镂空，选区内透明，选区外半透明）
- [x] 2.5 实现选区边框样式（1px 实线 + 四角控制点），尺寸标注（底部居中，宽 x 高）
- [x] 2.6 实现操作按钮（确认截图 / 取消），支持点击交互和 Escape 键取消
- [x] 2.7 实现最小选区校验（< 10x10 px 时提示且禁用确认按钮）
- [x] 2.8 确认选区时向 Background 发送 `CAPTURE_REGION` 消息（含坐标 + DPR），取消时发送 `CANCEL_CAPTURE` 并移除 overlay

## 3. Background Service Worker — 区域截图处理

- [x] 3.1 在 `src/background/index.ts` 消息路由中新增 `CAPTURE_REQUEST` 的 `region` 模式处理：向 Content Script 发送 `START_CAPTURE`
- [x] 3.2 在 `src/background/handlers/capture.ts` 中新增 `handleRegionCapture(region: RegionRect)` 函数：调用 `captureVisibleTab()` 后通过 OffscreenCanvas 裁剪
- [x] 3.3 实现 Canvas 裁剪逻辑：根据 `region` 坐标 × DPR 计算物理像素裁剪区域，导出为 PNG base64
- [x] 3.4 裁剪完成后写入 `chrome.storage.local` 并打开 Editor 页面（复用 `openEditor()`）
- [x] 3.5 注册 `Alt+Shift+R` 快捷键（manifest.json `commands` + Background `onCommand` 监听）

## 4. Popup 集成

- [x] 4.1 修改 `src/popup/App.tsx`，将「选择区域」按钮的 onClick 绑定为发送 `CAPTURE_REQUEST`（`mode: 'region'`）并关闭 Popup
- [x] 4.2 在 Footer 快捷键提示区域新增 `Alt+Shift+R` 区域截图快捷键说明

## 5. manifest.json 更新

- [x] 5.1 在 `commands` 中注册 `capture-region` 命令（`Alt+Shift+R`）
- [x] 5.2 确认 `content_scripts` 配置正确，overlay 使用 Shadow DOM 内联样式无需独立 CSS

## 6. 代码审查修复

- [x] 6.1 [H1] Content Script onMessage return true → return false（避免消息通道挂起）
- [x] 6.2 [H2] handleRegionCapture catch 块写入 storage（符合规范错误处理要求）
- [x] 6.3 [H3] CAPTURE_REGION payload 运行时校验（validateRegionRect）
- [x] 6.4 [H4] 非空断言替换为防御性检查（dataURL split + getContext）
- [x] 6.5 [M1] box-shadow 镂空效果实现选区内透明
- [x] 6.6 [M2/M3] overlay.ts 使用 createMessage 工厂函数 + 消除类型重复
- [x] 6.7 [M4/M5] 按钮溢出视口处理 + 按钮监听器 cleanup 清理
- [x] 6.8 [M6] Popup 等待 response 后关闭（消除竞态）

## 7. 验证

- [x] 7.1 手动验证：点击「选择区域」按钮，overlay 正确显示，拖拽选区流畅
- [x] 7.2 手动验证：确认选区后截图正确裁剪，Editor 展示裁剪结果
- [x] 7.3 手动验证：取消选区（按钮 / Escape）overlay 正确移除，无截图操作
- [x] 7.4 手动验证：选区太小（< 10x10）时提示正确且禁用确认
- [x] 7.5 手动验证：快捷键 `Alt+Shift+R` 触发区域截图
- [x] 7.6 手动验证：高 DPR 屏幕（Retina）截图裁剪精度正确、无模糊
- [x] 7.7 手动验证：受限页面（chrome://）不注入 overlay，显示错误

## 8. Bug 修复

- [x] 8.1 修复 CRXJS content script 未导出 `onExecute` 导致 overlay 不显示的问题
