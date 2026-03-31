# 变更：增强代码美化主题系统与背景选项

## 为什么

当前 CodeFrame CodeGen 仅支持 4 种代码主题（VS Code Dark+、One Dark、Solarized Dark、Light）和 5 种纯色背景，内容丰富度远低于竞品 chalk.ist（10+ 自定义主题、几十种 Shiki 内置主题、20+ 渐变/纹理背景）。用户需要更多主题和背景选择来生成更具视觉吸引力的代码截图，对标 chalk.ist 的美化能力。

## chalk.ist 功能分析

通过对 chalk.ist 源码（GitHub: Idered/chalk.ist）的深入分析，其核心美化能力如下：

### 主题系统
- **10+ 自定义品牌主题**：Vue、Nuxt、Tailwind CSS、Bluesky、Dawn、Linear、Monochrome、Liveblocks、CodeSandbox、Chrome 等
- **几十种 Shiki 内置主题**：动态加载所有 Shiki bundledThemes，包括 Dracula、GitHub Dark、Nord、Tokyo Night、Catppuccin 等
- **自定义主题编辑器**：可自定义每种语法元素（keyword、string、comment 等）的颜色
- **Diff 模式**：内置 diff 语法高亮（diffDeletedBg、diffInsertedBg 等）

### 背景系统
- **20+ 预设背景**：包含线性渐变、锥形渐变、模糊渐变、点阵纹理、纯色、透明等
- **品牌渐变**：Vue 绿、Nuxt 绿、Tailwind 蓝、Supabase 绿等
- **特殊背景**：宝可梦系列（Bulbasaur、Squirtle、Dragonite、Jigglypuff、Snorlax）、噪点纹理
- **用户自定义纯色**：支持任意颜色选择器

### 窗口样式
- **5 种深色窗口变体** + **6 种浅色窗口变体**
- **窗口控件**：Mac 轮廓风格等多种样式
- **窗口视觉调节**：背景透明度、圆角、高光、阴影、噪点纹理

### 特殊效果
- **粒子效果**：Canvas 2D 白色粒子随机漂移
- **反射效果**：窗口倒影
- **水印**：自定义文字 + 透明度

### 字体系统
- **7 种代码字体**：JetBrains Mono、Fira Code、Geist Mono、IBM Plex Mono、Nova、Overpass Mono、Source Code Pro
- **字体连字**：可开关
- **字号/行高**：可调范围大（12-40px 字号，20-64px 行高）

### 其他
- **多代码块布局**：列/行网格系统
- **代码块类型**：代码、Markdown、Note 注释
- **Twitter Badge**：社交徽章（头像、用户名、多平台图标）
- **预设系统**：创建/加载/分享预设

## 变更内容

### 第一阶段：主题扩展（P0）
- 扩展 THEMES 数组，新增 8+ 流行代码主题（Dracula、Nord、Tokyo Night、GitHub Dark、Catppuccin Mocha、Gruvbox Dark、Rose Pine、Kanagawa）
- 将 Shiki 主题映射为 CodeMirror 编辑器主题，提升编辑/预览一致性
- 重构主题配置结构，支持完整的语法颜色定义

### 第二阶段：背景系统升级（P0）
- 新增渐变背景支持（线性渐变、锥形渐变）
- 预设 10+ 精选渐变背景（参考 chalk.ist 热门渐变）
- 新增用户自定义背景颜色选择器
- 新增背景噪点纹理开关

### 第三阶段：窗口样式增强（P1）
- 新增窗口圆角调节（0-20px）
- 新增窗口阴影开关及强度调节
- 新增窗口背景透明度调节
- 新增窗口噪点纹理开关

### 第四阶段：字体扩展（P1）
- 新增 4+ 代码字体选项（Fira Code、Fira Code（连字）、Source Code Pro、IBM Plex Mono）
- 新增字体连字开关
- 新增字号调节（12-24px）

### 第五阶段：高级特效（P2）
- 新增水印功能（自定义文字 + 透明度）
- 新增反射效果
- 新增代码窗口可见性开关（隐藏窗口标题栏）

## 影响
- 受影响规范：`codegen`
- 受影响代码：`src/codegen/App.tsx`（主题/背景配置常量）、`src/codegen/index.html`（字体加载）、`src/shared/types.ts`（类型定义扩展）
- **不包含**：多代码块布局、Markdown 块、Twitter Badge、粒子效果（这些属于更高级的功能，建议后续独立提案）
