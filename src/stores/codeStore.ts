import { createSignal, createRoot, onMount } from 'solid-js';
import type { CodeSettings } from '~/utils/storage';
import { getStorage, setStorage, DEFAULT_SETTINGS } from '~/utils/storage';

// 语言列表
export const LANGUAGES = [
  { id: 'auto', name: '自动检测' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'c', name: 'C' },
  { id: 'cpp', name: 'C++' },
  { id: 'csharp', name: 'C#' },
  { id: 'php', name: 'PHP' },
  { id: 'ruby', name: 'Ruby' },
  { id: 'swift', name: 'Swift' },
  { id: 'kotlin', name: 'Kotlin' },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
  { id: 'sql', name: 'SQL' },
  { id: 'json', name: 'JSON' },
  { id: 'yaml', name: 'YAML' },
  { id: 'markdown', name: 'Markdown' },
  { id: 'bash', name: 'Bash' },
  { id: 'shell', name: 'Shell' },
  { id: 'dockerfile', name: 'Dockerfile' },
  { id: 'graphql', name: 'GraphQL' },
];

// 窗口样式
export const WINDOW_STYLES = [
  { id: 'macos', name: 'macOS', icon: '🍎' },
  { id: 'windows', name: 'Windows', icon: '🪟' },
  { id: 'none', name: '无边框', icon: '⬜' },
];

/**
 * 代码模块状态管理
 */
function createCodeStore() {
  // 代码内容
  const [code, setCode] = createSignal<string>('');
  
  // 语言
  const [language, setLanguage] = createSignal<string>('auto');
  
  // 设置
  const [settings, setSettings] = createSignal<CodeSettings>(DEFAULT_SETTINGS.code);
  
  // 加载设置
  async function loadSettings() {
    const { settings: storedSettings } = await getStorage(['settings']);
    if (storedSettings?.code) {
      setSettings(storedSettings.code);
      setLanguage(storedSettings.code.language);
    }
  }
  
  // 保存设置
  async function saveSettings(updates: Partial<CodeSettings>) {
    const newSettings = { ...settings(), ...updates };
    setSettings(newSettings);
    await setStorage({
      settings: {
        ...(await getStorage(['settings'])).settings,
        code: newSettings,
      },
    });
  }
  
  // 更新代码
  function updateCode(newCode: string) {
    setCode(newCode);
  }
  
  // 更新语言
  async function updateLanguage(lang: string) {
    setLanguage(lang);
    await saveSettings({ language: lang });
  }
  
  // 切换行号
  async function toggleLineNumbers() {
    await saveSettings({ showLineNumbers: !settings().showLineNumbers });
  }
  
  // 更新主题
  async function updateTheme(theme: string) {
    await saveSettings({ theme });
  }
  
  // 更新字体大小
  async function updateFontSize(size: number) {
    await saveSettings({ fontSize: size });
  }
  
  // 更新窗口样式
  async function updateWindowStyle(style: 'macos' | 'windows' | 'none') {
    await saveSettings({ windowStyle: style });
  }
  
  // 更新背景
  async function updateBackground(bg: string) {
    await saveSettings({ background: bg });
  }
  
  // 更新内边距
  async function updatePadding(padding: number) {
    await saveSettings({ padding });
  }
  
  // 重置为默认设置
  async function resetToDefault() {
    setSettings(DEFAULT_SETTINGS.code);
    setLanguage(DEFAULT_SETTINGS.code.language);
    await setStorage({
      settings: {
        ...(await getStorage(['settings'])).settings,
        code: DEFAULT_SETTINGS.code,
      },
    });
  }

  return {
    // 状态
    code,
    language,
    settings,
    
    // 方法
    loadSettings,
    updateCode,
    updateLanguage,
    toggleLineNumbers,
    updateTheme,
    updateFontSize,
    updateWindowStyle,
    updateBackground,
    updatePadding,
    resetToDefault,
    setCode,
  };
}

export const codeStore = createRoot(createCodeStore);
