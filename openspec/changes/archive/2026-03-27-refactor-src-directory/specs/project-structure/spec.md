# 项目结构规范

## 新增需求

### 需求：源码目录组织

项目必须将源码文件组织在 `src/` 目录下，配置文件保持在根目录。

#### 场景：源码目录结构

- **当** 开发者查看项目目录
- **那么** 源码文件应在 `src/` 目录下
- **And** 配置文件应在根目录

#### 场景：src 目录内容

- **当** 查看 `src/` 目录
- **那么** 应包含以下子目录：
  - `entrypoints/` - WXT 入口点
  - `components/` - UI 组件
  - `hooks/` - 自定义 Hooks
  - `stores/` - 状态管理
  - `utils/` - 工具函数
  - `assets/` - 静态资源配置
  - `env.d.ts` - 类型声明

---

### 需求：配置文件位置

项目配置文件必须保持在根目录。

#### 场景：根目录配置文件

- **当** 查看项目根目录
- **那么** 应包含以下配置文件：
  - `package.json` - 项目依赖
  - `tsconfig.json` - TypeScript 配置
  - `wxt.config.ts` - WXT 扩展配置
  - `tailwind.config.js` - Tailwind CSS 配置
  - `postcss.config.js` - PostCSS 配置
  - `.gitignore` - Git 忽略规则

---

### 需求：静态资源目录

公共静态资源必须保持在根目录的 `public/` 目录。

#### 场景：public 目录内容

- **当** 查看 `public/` 目录
- **那么** 应包含：
  - `icon/` - 扩展图标
  - `devices/` - 设备边框素材
