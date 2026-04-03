// Content Script 国际化工具
import i18n from 'i18next';
import zhCNCommon from './locales/zh-CN/common.json';
import zhCNPopup from './locales/zh-CN/popup.json';
import enUSCommon from './locales/en-US/common.json';
import enUSPopup from './locales/en-US/popup.json';

// 语言包资源
const resources = {
  'zh-CN': {
    common: zhCNCommon,
    popup: zhCNPopup,
  },
  'en-US': {
    common: enUSCommon,
    popup: enUSPopup,
  },
};

// 获取保存的语言设置
async function getSavedLanguage(): Promise<string> {
  try {
    const result = await chrome.storage.local.get('codeframe_settings');
    const settings = result?.codeframe_settings?.state?.settings;
    return settings?.language || 'zh-CN';
  } catch {
    return 'zh-CN';
  }
}

// 初始化 i18n（用于 Content Script）
export async function initContentI18n(): Promise<void> {
  const savedLanguage = await getSavedLanguage();

  await i18n.init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'zh-CN',
    defaultNS: 'common',
    ns: ['common', 'popup'],
    interpolation: {
      escapeValue: false,
    },
  });
}

// 获取翻译函数
export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}

// 获取当前语言
export function getCurrentLanguage(): string {
  return i18n.language;
}

export default i18n;
