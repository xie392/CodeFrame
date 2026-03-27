import { For, createMemo } from 'solid-js';
import { codeStore, LANGUAGES, WINDOW_STYLES } from '~/stores';
import { settingsStore } from '~/stores/settingsStore';
import { Select } from '~/components/ui';
import { ProBadge } from '~/components/ui/ProBadge';
import themes from '~/assets/themes.json';

/**
 * ThemeSelector 主题选择器组件
 */
export function ThemeSelector() {
  const isPro = () => settingsStore.isPro();
  
  const options = createMemo(() => {
    return themes.themes.map((theme) => ({
      value: theme.id,
      label: theme.name,
      disabled: theme.isPro && !isPro(),
      icon: theme.type === 'dark' ? '🌙' : '☀️',
    }));
  });
  
  return (
    <div class="space-y-2">
      <label class="flex items-center gap-2 text-sm text-text-secondary">
        代码主题
      </label>
      <Select
        options={options()}
        value={codeStore.settings().theme}
        onChange={(value) => codeStore.updateTheme(value)}
      />
    </div>
  );
}

/**
 * LanguageSelector 语言选择器组件
 */
export function LanguageSelector() {
  const options = createMemo(() => {
    return LANGUAGES.map((lang) => ({
      value: lang.id,
      label: lang.name,
    }));
  });
  
  return (
    <div class="space-y-2">
      <label class="text-sm text-text-secondary">语言</label>
      <Select
        options={options()}
        value={codeStore.language()}
        onChange={(value) => codeStore.updateLanguage(value)}
      />
    </div>
  );
}

/**
 * WindowStyleSelector 窗口样式选择器
 */
export function WindowStyleSelector() {
  const options = createMemo(() => {
    return WINDOW_STYLES.map((style) => ({
      value: style.id,
      label: style.name,
      icon: style.icon,
    }));
  });
  
  return (
    <div class="space-y-2">
      <label class="text-sm text-text-secondary">窗口样式</label>
      <Select
        options={options()}
        value={codeStore.settings().windowStyle}
        onChange={(value) => codeStore.updateWindowStyle(value as 'macos' | 'windows' | 'none')}
      />
    </div>
  );
}
