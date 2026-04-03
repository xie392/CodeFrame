import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@shared/stores/settings-store';

/**
 * 语言切换 Hook
 * 同步 Zustand store 和 i18next 的语言状态
 */
export function useLanguage() {
  const { i18n } = useTranslation();
  const { settings, updateSettings } = useSettingsStore();

  // 切换语言
  const changeLanguage = async (language: 'zh-CN' | 'en-US') => {
    await i18n.changeLanguage(language);
    updateSettings('language', language);
  };

  // 监听 store 变化，同步到 i18n
  useEffect(() => {
    if (settings.language && i18n.language !== settings.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings.language, i18n]);

  return {
    currentLanguage: settings.language,
    changeLanguage,
    t: i18n.t.bind(i18n),
  };
}

export default useLanguage;
