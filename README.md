<p align="center">
  <img src="public/icons/logo.png" alt="CodeFrame Logo" width="128" height="128">
</p>

<h1 align="center">CodeFrame</h1>

<p align="center">
  <strong>A Code Screenshot Beautifier - Chrome Extension for Screenshot Annotation & Code Beautification</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#development">Development</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-emerald" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/chrome-88+-green" alt="Chrome">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome">
</p>

<p align="center">
  <a href="README.zh-CN.md">简体中文</a>
</p>

---

## Screenshots

<p align="center">
  <img src="public/screenshots/popup.png" alt="Popup" width="280">
  <img src="public/screenshots/editor.png" alt="Editor" width="280">
  <img src="public/screenshots/code.png" alt="Code" width="280">
</p>

<p align="center">
  <em>Popup</em> • <em>Image Editor</em> • <em>Code Beautifier</em>
</p>

---

## Features

### 📸 Screenshot Capture

| Feature | Description |
|---------|-------------|
| Region Capture | Select any screen region to capture |
| Visible Area | Capture current browser viewport |
| Full Page | Auto-scroll and stitch for complete page screenshot |
| Desktop Capture | Capture other application windows |
| Delayed Capture | Timer-based capture with 3/5/10 second delay |

### ✏️ Image Annotation

| Feature | Description |
|---------|-------------|
| Arrow Tool | Draw directional arrows with multiple styles |
| Shape Tool | Rectangle and circle annotations |
| Text Tool | Add text labels with font/size/color options |
| Mosaic Tool | Blur sensitive information |
| Undo/Redo | Multi-step undo and redo operations |

### 💻 Code Beautification

| Feature | Description |
|---------|-------------|
| Code Input | Manual input, paste, or drag & drop files |
| Syntax Highlighting | High-quality highlighting for 180+ languages |
| Theme Selection | 30+ built-in code themes |
| Gradient Background | Preset gradients + custom backgrounds |
| Window Style | macOS/Windows style window frames |
| Line Highlighting | Highlight specific code lines |

### 📤 Export & Share

| Feature | Description |
|---------|-------------|
| Multi-format Export | PNG/JPG/WEBP formats |
| Copy to Clipboard | One-click copy to system clipboard |
| Local Download | Save to local file system |

---

## Installation

### Chrome Web Store (Recommended)

> Coming Soon

### Local Development Install

1. **Clone the repository**

```bash
git clone https://github.com/xie392/CodeFrame.git
cd CodeFrame
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Build the extension**

```bash
pnpm build
```

4. **Load into Chrome**

- Open Chrome and navigate to `chrome://extensions/`
- Enable "Developer mode" in the top right corner
- Click "Load unpacked"
- Select the `dist` directory from the project

---

## Usage

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + Shift + S` | Capture visible area |
| `Alt + Shift + R` | Select region to capture |
| `Alt + Shift + F` | Full page screenshot |
| `Alt + Shift + D` | Desktop capture |

### Basic Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Screenshot │ ──→ │  Annotation │ ──→ │   Export    │
│   Capture   │     │   Editor    │     │   & Share   │
└─────────────┘     └─────────────┘     └─────────────┘
```

1. Click the CodeFrame icon in the browser toolbar
2. Select capture mode (Region/Visible/Full Page/Desktop)
3. Add annotations in the editor (arrows/text/mosaic etc.)
4. Export or copy to clipboard

### Code Beautification

1. Click the icon to open CodeFrame
2. Switch to the "Code" tab
3. Paste or type your code
4. Choose theme, background, font and other styles
5. Click export or copy

---

## Development

### Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite + CRXJS |
| Styling | TailwindCSS |
| Code Highlighting | Shiki |
| Canvas | Konva.js |
| State Management | Zustand |
| Extension Spec | Manifest V3 |

### Local Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Lint code
pnpm lint

# Run tests
pnpm test

# Type check
pnpm typecheck
```

### Project Structure

```
src/
├── background/     # Service Worker
├── popup/          # Main popup
├── editor/         # Image editor
├── codegen/        # Code generator
├── content/        # Content scripts
├── shared/         # Shared modules
└── options/        # Settings page
```

---

## Contributing

We welcome all forms of contributions!

### How to Contribute

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

### Code Standards

- Follow ESLint + Prettier configuration
- Line length ≤ 80 characters
- Follow [Conventional Commits](https://www.conventionalcommits.org/)

### Development Guidelines

- New code < 100 lines
- Prefer pure functions
- Single responsibility principle
- No `any` types

---

## License

This project is open-sourced under the [MIT](LICENSE) license.

---

## Special Note

This project was built entirely through **Vibe Coding** - all code was generated with AI assistance, without manually writing a single line of code. 🤖✨

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/xie392">xie392</a>
</p>
