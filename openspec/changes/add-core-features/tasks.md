# 实施任务清单

## 1. 项目初始化

- [x] 1.1 使用 WXT 初始化项目结构 (`pnpm create wxt codeframe`)
- [x] 1.2 安装核心依赖 (`@wxt-dev/module-solid`, `tailwindcss`, `highlight.js`)
- [x] 1.3 配置 TypeScript 严格模式
- [x] 1.4 配置 Tailwind CSS
- [x] 1.5 创建基础目录结构 (components/, hooks/, stores/, utils/)

## 2. 基础 UI 组件

- [x] 2.1 创建 Button 组件
- [x] 2.2 创建 Select 下拉组件
- [x] 2.3 创建 Slider 滑块组件
- [x] 2.4 创建 Modal 弹窗组件
- [x] 2.5 创建 Tabs 标签页组件（集成到 App.tsx）
- [x] 2.6 创建 Toggle 开关组件

## 3. 代码转图片模块

- [x] 3.1 创建 CodeEditor 代码编辑器组件
- [x] 3.2 实现语言自动检测功能
- [x] 3.3 集成 highlight.js 语法高亮
- [x] 3.4 创建 ThemeSelector 主题选择器
- [x] 3.5 创建 BackgroundPicker 背景选择器
- [x] 3.6 创建 WindowStyle 窗口样式选择器
- [x] 3.7 创建 CodePreview 实时预览组件
- [ ] 3.8 实现 Canvas 渲染导出

## 4. 截图美化模块

- [x] 4.1 实现标签页捕获功能 (`chrome.tabs.captureVisibleTab`)
- [x] 4.2 创建 ImageSource 图片来源组件
- [x] 4.3 创建 DeviceFrame 设备边框组件
- [x] 4.4 创建 BackgroundSelector 背景选择器
- [x] 4.5 创建 EffectControls 效果调整组件
- [x] 4.6 创建 SizePresets 尺寸预设组件
- [x] 4.7 创建 ScreenshotPreview 预览组件

## 5. 导出模块

- [x] 5.1 实现 PNG 导出功能（UI 完成）
- [x] 5.2 实现 WebP 导出功能 (Pro)（UI 完成）
- [x] 5.3 实现 SVG 导出功能 (Pro)（UI 完成）
- [x] 5.4 实现复制到剪贴板功能（UI 完成）
- [x] 5.5 实现多分辨率导出 (Pro)（UI 完成）
- [ ] 5.6 实现水印添加逻辑

## 6. 付费系统

- [x] 6.1 创建 License 验证工具函数
- [x] 6.2 创建 useProStatus Hook（集成到 settingsStore）
- [x] 6.3 创建 UpgradeModal 升级弹窗
- [ ] 6.4 创建 ActivatePage 激活页面
- [x] 6.5 创建 ProBadge Pro 徽章组件
- [x] 6.6 集成 Lemon Squeezy API
- [x] 6.7 实现每日 License 缓存验证

## 7. 状态管理与存储

- [x] 7.1 创建 codeStore 代码模块状态
- [x] 7.2 创建 screenshotStore 截图模块状态
- [x] 7.3 创建 settingsStore 设置状态
- [x] 7.4 封装 chrome.storage.sync 存储工具

## 8. 配置文件

- [x] 8.1 创建 themes.json 代码主题配置
- [x] 8.2 创建 backgrounds.json 背景配置
- [x] 8.3 创建 devices.json 设备边框配置

## 9. 入口点开发

- [x] 9.1 开发 popup 主弹窗入口
- [ ] 9.2 开发 options 设置页入口
- [x] 9.3 配置 background.ts Service Worker
- [x] 9.4 配置 manifest.json 权限

## 10. 测试与优化

- [ ] 10.1 编写核心工具函数单元测试
- [ ] 10.2 编写 License 验证集成测试
- [ ] 10.3 编写导出流程 E2E 测试
- [ ] 10.4 性能优化（确保弹窗打开 < 200ms）
- [x] 10.5 包体积优化（当前 229 KB < 1MB）

## 11. 发布准备

- [ ] 11.1 准备 Chrome Web Store 素材
- [ ] 11.2 配置 Lemon Squeezy 产品
- [ ] 11.3 编写隐私政策
- [ ] 11.4 提交审核
