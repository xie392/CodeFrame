# 变更：完善截图质量设置规范与实现

## 为什么

当前"截图质量"设置（标准/高清/超高清）存在以下问题：

1. **规范不完整**：options 规范只定义了 UI 选项，未说明各质量等级的具体含义（DPR 值）
2. **截图捕获未应用**：`capture.ts` 中未读取和应用 quality 设置，所有截图固定使用 PNG 格式
3. **行为不一致**：Editor/Codegen 导出已应用 quality 设置，但截图捕获未应用

## 变更内容

### 1. 明确质量等级定义

| 等级 | 标签 | DPR 缩放 | 适用场景 |
|------|------|----------|----------|
| 标准 | 标准 | 1x | 快速分享、文档插图 |
| 高清 | 高清 | 2x | 高质量分享、演示文稿 |
| 超高清 | 超高清 | 3x | 印刷品、高清屏幕 |

### 2. 质量设置生效范围

- **截图捕获**：捕获时按 quality 设置进行缩放处理
- **Editor 导出**：已实现，补充规范说明
- **Codegen 导出**：已实现，补充规范说明

### 3. 技术实现

截图捕获时：
1. 使用 `chrome.tabs.captureVisibleTab` 按系统 DPR 捕获
2. 读取用户 quality 设置
3. 通过 Canvas 按目标 DPR 进行缩放处理
4. 输出指定质量的图片

## 影响

- 受影响规范：`options`, `screenshot`, `editor`, `codegen`
- 受影响代码：
  - `src/background/handlers/capture.ts` - 需读取 quality 设置并应用缩放
  - `src/background/handlers/fullpage.ts` - 整页截图同样需要应用
