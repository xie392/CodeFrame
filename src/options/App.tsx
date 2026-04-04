import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsSection } from './components/SettingsSection';
import { SettingItem } from './components/SettingItem';
import { SettingSelect } from './components/SettingSelect';
import { SettingSwitch } from './components/SettingSwitch';
import { ShortcutDisplay } from './components/ShortcutDisplay';
import { ShortcutRecorder } from './components/ShortcutRecorder';
import { ConflictAlert } from './components/ConflictAlert';
import { useSettingsStore } from '@shared/stores/settings-store';
import {
  EXPORT_FORMAT_LABELS,
  QUALITY_LABELS,
  LANGUAGE_LABELS,
  EXTENSION_VERSION,
  EXTENSION_AUTHOR,
  REPOSITORY_URL,
  SHORTCUT_COMMAND_LABELS,
  CUSTOM_SHORTCUTS_DEFAULT,
} from '@shared/constants';
import {
  Image,
  Maximize2,
  Languages,
  History,
  Clock,
  Trash2,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import type { ShortcutCommand } from '@shared/types';
import {
  checkShortcutConflict,
  getSuggestedAlternatives,
  type ConflictResult,
} from '@shared/utils/shortcut-utils';

const OptionsPage: React.FC = () => {
  const { t } = useTranslation('options');
  const {
    settings,
    isLoading,
    updateSettings,
    clearOperationHistory,
    updateShortcut,
    toggleShortcutsEnabled,
    resetShortcuts,
  } = useSettingsStore();

  // 冲突状态
  const [conflict, setConflict] = useState<ConflictResult>({
    hasConflict: false,
    type: null,
    message: '',
  });

  // 清除操作历史
  const handleClearHistory = () => {
    if (window.confirm(t('hint.confirmClearHistory'))) {
      clearOperationHistory();
    }
  };

  // 打开 Chrome 快捷键配置页面
  const openChromeShortcutsPage = () => {
    chrome.tabs.create({
      url: 'chrome://extensions/shortcuts',
    });
  };

  // 处理快捷键变更
  const handleShortcutChange = useCallback(
    (command: ShortcutCommand, shortcut: string) => {
      // 检测冲突
      const conflictResult = checkShortcutConflict(
        shortcut,
        command,
        settings.shortcuts.custom
      );

      if (conflictResult.hasConflict) {
        setConflict(conflictResult);
        return;
      }

      // 清除冲突提示
      setConflict({ hasConflict: false, type: null, message: '' });

      // 更新快捷键
      updateShortcut(command, shortcut);
    },
    [settings.shortcuts.custom, updateShortcut]
  );

  // 清除快捷键
  const handleClearShortcut = useCallback(
    (command: ShortcutCommand) => {
      updateShortcut(command, '');
    },
    [updateShortcut]
  );

  // 重置单个快捷键
  const handleResetShortcut = useCallback(
    (command: ShortcutCommand) => {
      const defaultShortcut = CUSTOM_SHORTCUTS_DEFAULT[command];
      if (defaultShortcut) {
        updateShortcut(command, defaultShortcut);
      }
    },
    [updateShortcut]
  );

  // 重置所有快捷键
  const handleResetAllShortcuts = () => {
    resetShortcuts();
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

  // 快捷键命令列表
  const shortcutCommands: ShortcutCommand[] = [
    'captureVisible',
    'captureRegion',
    'captureFullpage',
    'captureDesktop',
  ];

  // 获取冲突建议
  const conflictSuggestions = conflict.hasConflict
    ? getSuggestedAlternatives(
        conflict.conflictingCommand
          ? settings.shortcuts.custom[conflict.conflictingCommand]
          : ''
      )
    : [];

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
                options={Object.entries(EXPORT_FORMAT_LABELS).map(
                  ([value, label]) => ({
                    value,
                    label,
                  })
                )}
                onChange={(value) =>
                  updateSettings(
                    'defaultFormat',
                    value as typeof settings.defaultFormat
                  )
                }
              />
            </SettingItem>
            <SettingItem icon={Maximize2} label={t('label.quality')}>
              <SettingSelect
                value={settings.quality}
                options={Object.entries(QUALITY_LABELS).map(
                  ([value, label]) => ({
                    value,
                    label,
                  })
                )}
                onChange={(value) =>
                  updateSettings('quality', value as typeof settings.quality)
                }
              />
            </SettingItem>
            <SettingItem icon={Languages} label={t('label.language')}>
              <SettingSelect
                value={settings.language}
                options={Object.entries(LANGUAGE_LABELS).map(
                  ([value, label]) => ({
                    value,
                    label,
                  })
                )}
                onChange={(value) =>
                  updateSettings('language', value as typeof settings.language)
                }
              />
            </SettingItem>
          </SettingsSection>

          {/* [操作历史] */}
          <SettingsSection title={t('section.history')}>
            <SettingItem
              icon={History}
              label={t('label.saveOperationHistory')}
            >
              <SettingSwitch
                checked={settings.saveOperationHistory}
                onChange={(checked) =>
                  updateSettings('saveOperationHistory', checked)
                }
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
                onChange={(value) =>
                  updateSettings(
                    'delayTime',
                    Number(value) as typeof settings.delayTime
                  )
                }
              />
            </SettingItem>
          </SettingsSection>

          {/* [快捷键] */}
          <SettingsSection title={t('section.shortcuts')}>
            {/* 冲突提示 */}
            {conflict.hasConflict && (
              <div className="px-5 pb-3">
                <ConflictAlert
                  conflict={conflict}
                  suggestions={conflictSuggestions}
                  onClose={() =>
                    setConflict({
                      hasConflict: false,
                      type: null,
                      message: '',
                    })
                  }
                />
              </div>
            )}

            {/* 全局快捷键（Chrome 原生命令） */}
            <div className="px-5 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-semibold text-[#1A1A1A] font-body">
                  {t('label.nativeShortcuts')}
                </span>
                <button
                  onClick={openChromeShortcutsPage}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#00B892] font-body hover:underline"
                >
                  {t('action.goToConfig')}
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
              <div className="text-[11px] text-[#999999] font-body mb-3">
                {t('hint.nativeShortcutsConfig')}
              </div>
              <div className="flex flex-col gap-2">
                {shortcutCommands.map((command) => (
                  <div
                    key={command}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-[12px] text-[#666666] font-body">
                      {SHORTCUT_COMMAND_LABELS[command]}
                    </span>
                    <ShortcutDisplay
                      keys={settings.shortcuts.native[command].split('+')}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 分隔线 */}
            <div className="mx-5 border-t border-[#E5E5E5]" />

            {/* 页面快捷键（自定义） */}
            <div className="px-5 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-semibold text-[#1A1A1A] font-body">
                  {t('label.pageShortcuts')}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetAllShortcuts}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#666666] font-body hover:text-[#333333]"
                  >
                    <RotateCcw className="w-3 h-3" />
                    {t('action.resetAll')}
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-[#999999] font-body mb-3">
                {t('hint.pageShortcutsConfig')}
              </div>

              {/* 启用开关 */}
              <div className="flex items-center justify-between py-2 border-b border-[#E5E5E5] mb-2">
                <span className="text-[12px] text-[#666666] font-body">
                  {t('label.enablePageShortcuts')}
                </span>
                <SettingSwitch
                  checked={settings.shortcuts.enabled}
                  onChange={(checked) => toggleShortcutsEnabled(checked)}
                />
              </div>

              {/* 快捷键列表 */}
              <div className="flex flex-col gap-2">
                {shortcutCommands.map((command) => (
                  <div
                    key={command}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-[12px] text-[#666666] font-body">
                      {SHORTCUT_COMMAND_LABELS[command]}
                    </span>
                    <ShortcutRecorder
                      value={settings.shortcuts.custom[command]}
                      onChange={(shortcut) =>
                        handleShortcutChange(command, shortcut)
                      }
                      onClear={() => handleClearShortcut(command)}
                      onReset={() => handleResetShortcut(command)}
                      placeholder={t('hint.noShortcut')}
                      disabled={!settings.shortcuts.enabled}
                    />
                  </div>
                ))}
              </div>
            </div>
          </SettingsSection>

          {/* [关于] */}
          <SettingsSection title={t('section.about')}>
            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#999999] font-body">
                  {t('about.version')}
                </span>
                <span className="text-[13px] text-[#1A1A1A] font-body">
                  {EXTENSION_VERSION}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#999999] font-body">
                  {t('about.author')}
                </span>
                <span className="text-[13px] text-[#1A1A1A] font-body">
                  {EXTENSION_AUTHOR}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#999999] font-body">
                  {t('about.repository')}
                </span>
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
