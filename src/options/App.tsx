import React from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsSection } from './components/SettingsSection';
import { SettingItem } from './components/SettingItem';
import { SettingSelect } from './components/SettingSelect';
import { SettingSwitch } from './components/SettingSwitch';
import { ShortcutDisplay } from './components/ShortcutDisplay';
import { useSettingsStore } from '@shared/stores/settings-store';
import {
  EXPORT_FORMAT_LABELS,
  QUALITY_LABELS,
  LANGUAGE_LABELS,
  EXTENSION_VERSION,
  EXTENSION_AUTHOR,
  REPOSITORY_URL,
} from '@shared/constants';
import {
  Image,
  Maximize2,
  Languages,
  History,
  Clock,
  Camera,
  Terminal,
  Trash2,
} from 'lucide-react';

const OptionsPage: React.FC = () => {
  const { t } = useTranslation('options');
  const { settings, isLoading, updateSettings, clearOperationHistory } = useSettingsStore();

  // 清除操作历史
  const handleClearHistory = () => {
    if (window.confirm(t('hint.confirmClearHistory'))) {
      clearOperationHistory();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center options-container">
        <div className="text-[#777777] text-[13px] font-body">
          {t('common:loading')}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen options-container p-10">
      {/* 页面容器 */}
      <div
        className="w-full max-w-[800px] mx-auto rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF90 0%, #FFFFFF70 100%)',
          border: '1px solid rgba(255,255,255,0.5)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        {/* Header */}
        <div
          className="w-full h-16 px-10 flex items-center gap-3"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF90 0%, #FFFFFF70 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.5)',
          }}
        >
          {/* Logo */}
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center"
            style={{ background: '#FF6B35' }}
          >
            <span className="text-[16px] font-bold font-heading text-[#0D0D0D]">
              CF
            </span>
          </div>
          {/* 标题 */}
          <span className="text-[20px] font-semibold font-heading text-[#1A1A1A]">
            {t('header.title')}
          </span>
        </div>

        {/* Content */}
        <div className="w-full p-10 flex flex-col gap-6">
          {/* [通用设置] */}
          <SettingsSection title={t('section.general')}>
            <SettingItem icon={Image} label={t('label.defaultFormat')}>
              <SettingSelect
                value={settings.defaultFormat}
                options={Object.entries(EXPORT_FORMAT_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                onChange={(value) => updateSettings('defaultFormat', value as typeof settings.defaultFormat)}
              />
            </SettingItem>
            <SettingItem icon={Maximize2} label={t('label.quality')}>
              <SettingSelect
                value={settings.quality}
                options={Object.entries(QUALITY_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                onChange={(value) => updateSettings('quality', value as typeof settings.quality)}
              />
            </SettingItem>
            <SettingItem icon={Languages} label={t('label.language')}>
              <SettingSelect
                value={settings.language}
                options={Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                onChange={(value) => updateSettings('language', value as typeof settings.language)}
              />
            </SettingItem>
          </SettingsSection>

          {/* [操作历史] */}
          <SettingsSection title={t('section.history')}>
            <SettingItem icon={History} label={t('label.saveOperationHistory')}>
              <SettingSwitch
                checked={settings.saveOperationHistory}
                onChange={(checked) => updateSettings('saveOperationHistory', checked)}
              />
            </SettingItem>
            <div className="px-5 py-2 text-[11px] text-[#999999] font-body">
              {t('hint.saveOperationHistory')}
            </div>
            <SettingItem icon={Trash2} label={t('label.clearHistory')}>
              <button
                onClick={handleClearHistory}
                className="px-3 py-1.5 text-[11px] font-body rounded-[6px] transition-colors"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
              >
                {t('action.clear')}
              </button>
            </SettingItem>
          </SettingsSection>

          {/* [截图设置] */}
          <SettingsSection title={t('section.screenshot')}>
            <SettingItem icon={Clock} label={t('label.delayTime')}>
              <SettingSelect
                value={String(settings.delayTime)}
                options={[
                  { value: '3', label: t('delay.3s') },
                  { value: '5', label: t('delay.5s') },
                  { value: '10', label: t('delay.10s') },
                ]}
                onChange={(value) => updateSettings('delayTime', Number(value) as typeof settings.delayTime)}
              />
            </SettingItem>
          </SettingsSection>





          {/* [快捷键] */}
          <SettingsSection title={t('section.shortcuts')}>
            <SettingItem icon={Camera} label={t('label.screenshot')}>
              <ShortcutDisplay keys={['Alt', 'Shift', 'S']} />
            </SettingItem>
            <SettingItem icon={Terminal} label={t('label.codeEditor')}>
              <ShortcutDisplay keys={['Alt', 'Shift', 'C']} />
            </SettingItem>
            <div className="px-5 py-2 text-[11px] text-[#999999] font-body">
              {t('hint.shortcutsConfig')}
            </div>
          </SettingsSection>

          {/* [关于] */}
          <SettingsSection title={t('section.about')}>
            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#999999] font-body">{t('about.version')}</span>
                <span className="text-[13px] text-[#1A1A1A] font-body">
                  {EXTENSION_VERSION}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#999999] font-body">{t('about.author')}</span>
                <span className="text-[13px] text-[#1A1A1A] font-body">
                  {EXTENSION_AUTHOR}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#999999] font-body">{t('about.repository')}</span>
                <a
                  href={REPOSITORY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-[#00B892] font-body hover:underline"
                >
                  {REPOSITORY_URL.replace('https://', '')}
                </a>
              </div>
            </div>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
};

export default OptionsPage;
