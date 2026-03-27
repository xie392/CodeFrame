## 新增需求

### 需求：TailwindCSS 配置

项目**必须**有完整的 TailwindCSS 配置。

#### 场景：Tailwind 配置文件

- **当** 开发者查看 `tailwind.config.js`
- **那么** 文件**必须**包含：
  - `content`: 内容路径配置
  - `theme`: 主题扩展配置
  - `plugins`: 插件配置

#### 场景：内容路径配置

- **当** TailwindCSS 扫描类名
- **那么** **必须**扫描以下路径：
  - `./index.html`
  - `./src/**/*.{js,ts,jsx,tsx}`

#### 场景：主题扩展

- **当** 开发者查看 `theme.extend`
- **那么** **必须**包含：
  - 自定义颜色（符合 Terminal Minimal 风格）
  - 自定义字体
  - 自定义间距

#### 场景：PostCSS 配置

- **当** 开发者查看 `postcss.config.js`
- **那么** 文件**必须**包含 `tailwindcss` 插件

### 需求：CSS Variables 主题系统

项目**必须**使用 CSS Variables 定义主题。

#### 场景：颜色变量

- **当** 开发者查看 `globals.css`
- **那么** **必须**定义以下颜色变量：
  - `--color-bg-primary`: #0A0A0A（页面背景）
  - `--color-bg-secondary`: #0F0F0F（表头背景）
  - `--color-bg-tertiary`: #1F1F1F（激活导航）
  - `--color-text-primary`: #FAFAFA（主要文字）
  - `--color-text-secondary`: #6B7280（次要文字）
  - `--color-accent`: #10B981（强调色）

#### 场景：字体变量

- **当** 开发者查看 `globals.css`
- **那么** **必须**定义以下字体变量：
  - `--font-primary`: JetBrains Mono
  - `--font-secondary`: IBM Plex Mono

#### 场景：间距变量

- **当** 开发者查看 `globals.css`
- **那么** **必须**定义标准间距变量（4px 基准）

### 需求：字体配置

项目**必须**正确配置等宽字体。

#### 场景：字体加载

- **当** 应用加载
- **那么** **必须**加载 JetBrains Mono 和 IBM Plex Mono 字体

#### 场景：字体应用

- **当** 开发者使用 `font-mono` 类
- **那么** **必须**应用 JetBrains Mono 字体
