# 变更：实现设置页面 UI

## 为什么

当前设置页面 (`src/options/App.tsx`) 仅为占位实现，需要根据设计稿 `ui.pen` 中的 "Options - Light" 设计实现完整的亮色设置页面，为用户提供扩展配置能力。

## 变更内容

### 页面布局
- 实现设置页面 Header（Logo + 标题）
- 采用亮色玻璃拟态设计风格，与现有 UI 风格保持一致

### 设置区块（全部中文显示）

1. **[通用设置]**
   - 默认主题（深色 / 浅色 / 跟随系统）
   - 默认导出格式（PNG / JPG / WEBP / SVG）
   - 截图质量（标准 / 高清 / 超高清）
   - 界面语言（简体中文 / English）

2. **[操作历史]**
   - 保存操作历史开关（开启后记录用户配置，下次恢复用户设置而非默认配置）

3. **[截图设置]**
   - 延迟截图时间（3秒 / 5秒 / 10秒）
   - 历史保留天数（7天 / 30天 / 90天 / 永久保存）

4. **[水印设置]**
   - 默认添加水印开关
   - 水印文字输入
   - 水印透明度滑块

5. **[代码美化]**
   - 代码主题选择（GitHub 暗色 / One Dark / Nord 等）
   - 字体大小滑块
   - 显示行号开关

6. **[快捷键]**
   - 截图快捷键（Alt+Shift+S）
   - 代码编辑器快捷键（Alt+Shift+C）

7. **[关于]**
   - 版本号、作者、仓库链接

## 影响

- **新增规范**：`specs/options` - 设置页面功能规范
- **受影响代码**：
  - `src/options/App.tsx` - 主页面组件
  - `src/options/index.html` - 入口 HTML
  - `src/shared/constants.ts` - 扩展设置常量
  - `src/shared/hooks/` - 新增 useSettings Hook
  - `src/shared/stores/` - 新增 settings store
  - `src/shared/components/ui/` - 复用现有 UI 组件
