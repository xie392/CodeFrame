import i18n, { type TFunction } from 'i18next';
import { initReactI18next } from 'react-i18next';

// 导入语言包
import zhCNCommon from './locales/zh-CN/common.json';
import zhCNOptions from './locales/zh-CN/options.json';
import zhCNPopup from './locales/zh-CN/popup.json';
import zhCNEditor from './locales/zh-CN/editor.json';
import zhCNCodegen from './locales/zh-CN/codegen.json';

import enUSCommon from './locales/en-US/common.json';
import enUSOptions from './locales/en-US/options.json';
import enUSPopup from './locales/en-US/popup.json';
import enUSEditor from './locales/en-US/editor.json';
import enUSCodegen from './locales/en-US/codegen.json';

// 语言包资源
const resources = {
  'zh-CN': {
    common: zhCNCommon,
    options: zhCNOptions,
    popup: zhCNPopup,
    editor: zhCNEditor,
    codegen: zhCNCodegen,
  },
  'en-US': {
    common: enUSCommon,
    options: enUSOptions,
    popup: enUSPopup,
    editor: enUSEditor,
    codegen: enUSCodegen,
  },
};

// 语言类型
type Language = 'zh-CN' | 'en-US';

// 存储结构类型
interface StoredSettings {
  codeframe_settings?: {
    state?: {
      settings?: {
        language?: string;
      };
    };
  };
}

// 类型守卫：验证语言值是否有效
function isValidLanguage(value: unknown): value is Language {
  return value === 'zh-CN' || value === 'en-US';
}

// 获取保存的语言设置
async function getSavedLanguage(): Promise<string> {
  try {
    const result = await chrome.storage.local.get('codeframe_settings') as StoredSettings;
    const settings = result?.codeframe_settings?.state?.settings;
    if (settings && isValidLanguage(settings.language)) {
      return settings.language;
    }
    return 'zh-CN';
  } catch {
    return 'zh-CN';
  }
}

// 初始化 i18n
export async function initI18n(): Promise<TFunction> {
  const savedLanguage = await getSavedLanguage();

  return i18n.use(initReactI18next).init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'zh-CN',
    defaultNS: 'common',
    ns: ['common', 'options', 'popup', 'editor', 'codegen'],
    interpolation: {
      escapeValue: false, // React 已处理 XSS
    },
    react: {
      useSuspense: false,
    },
  });
}

// 监听语言设置变化
export function setupLanguageListener(): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    
    if (changes.codeframe_settings) {
      const newSettings = (changes.codeframe_settings.newValue as StoredSettings['codeframe_settings'])?.state?.settings;
      const oldSettings = (changes.codeframe_settings.oldValue as StoredSettings['codeframe_settings'])?.state?.settings;
      
      if (newSettings?.language && newSettings.language !== oldSettings?.language) {
        // 使用 then 确保 Promise 完成
        i18n.changeLanguage(newSettings.language).catch(console.error);
      }
    }
  });
}

// 手动切换语言（同步 store 和 i18n）
export async function changeLanguage(language: 'zh-CN' | 'en-US'): Promise<void> {
  await i18n.changeLanguage(language);
}

export default i18n;
