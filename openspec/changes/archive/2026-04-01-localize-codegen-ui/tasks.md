# 任务清单：localize-codegen-ui

## 任务列表

- [x] **1. 替换 SectionLabel 英文标签为中文**
  - 文件：`src/codegen/App.tsx`
  - 将 `theme` → `主题`、`background` → `背景`、`padding` → `内边距`、`window` → `窗口`、`border_radius` → `圆角`、`font` → `字体`、`watermark` → `水印`
  - 验证：视觉确认侧边栏所有区块标题显示为中文

- [x] **2. 替换 Toggle 标签为中文**
  - 文件：`src/codegen/App.tsx`
  - 将 `title_bar` → `标题栏`、`shadow` → `阴影`、`line_numbers` → `行号`
  - 验证：视觉确认所有开关标签显示为中文

- [x] **3. 替换 Popover 标签为中文**
  - 文件：`src/codegen/App.tsx`
  - 将 `outer` → `外圆角`、`inner` → `内圆角`
  - 验证：打开圆角设置弹窗确认标签为中文

- [x] **4. 替换按钮和输入框文案为中文**
  - 文件：`src/codegen/App.tsx`
  - 将 `Watermark text...` → `水印文字...`、`exporting...` → `导出中...`、`$ export_image` → `$ 导出图片`
  - 验证：测试水印输入、导出按钮各状态文案

- [x] **5. 移除旧 `code_input` 标题**
  - 文件：`src/codegen/App.tsx`
  - 删除侧边栏顶部 `code_input` 文本及其包裹元素
  - 验证：确认侧边栏顶部不再显示旧标题，布局无异常

## 依赖关系

无。所有任务可并行执行，均在同一文件中修改。

## 并行工作

所有任务均在 `src/codegen/App.tsx` 中完成，建议一次性修改后统一验证。
