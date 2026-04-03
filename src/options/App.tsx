import React from 'react';
import { SettingsSection } from './components/SettingsSection';
import { SettingItem } from './components/SettingItem';
import { SettingSelect } from './components/SettingSelect';
import { SettingSwitch } from './components/SettingSwitch';
import { SettingInput } from './components/SettingInput';
import { SettingSlider } from './components/SettingSlider';
import { ShortcutDisplay } from './components/ShortcutDisplay';
import { useSettingsStore } from '@shared/stores/settings-store';
import {
  THEME_LABELS,
  EXPORT_FORMAT_LABELS,
  QUALITY_LABELS,
  LANGUAGE_LABELS,
  HISTORY_RETENTION_LABELS,
  CODE_THEME_OPTIONS,
  EXTENSION_VERSION,
  EXTENSION_AUTHOR,
  REPOSITORY_URL,
} from '@shared/constants';
import {
  Globe,
  Image,
  Maximize2,
  Languages,
  History,
  Clock,
  Database,
  Droplet,
  Type,
  Code2,
  Hash,
  Camera,
  Terminal,
} from 'lucide-react';

const OptionsPage: React.FC = () => {
  const { settings, isLoading, updateSettings } = useSettingsStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center options-container">
        <div className="text-[#777777] text-[13px] font-body">
          加载中...
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
            设置
          </span>
        </div>

        {/* Content */}
        <div className="w-full p-10 flex flex-col gap-6">
          {/* [通用设置] */}
          <SettingsSection title="通用设置">
            <SettingItem icon={Globe} label="默认主题">
              <SettingSelect
                value={settings.theme}
                options={Object.entries(THEME_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                onChange={(value) => updateSettings('theme', value as typeof settings.theme)}
              />
            </SettingItem>
            <SettingItem icon={Image} label="默认导出格式">
              <SettingSelect
                value={settings.defaultFormat}
                options={Object.entries(EXPORT_FORMAT_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                onChange={(value) => updateSettings('defaultFormat', value as typeof settings.defaultFormat)}
              />
            </SettingItem>
            <SettingItem icon={Maximize2} label="截图质量">
              <SettingSelect
                value={settings.quality}
                options={Object.entries(QUALITY_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                onChange={(value) => updateSettings('quality', value as typeof settings.quality)}
              />
            </SettingItem>
            <SettingItem icon={Languages} label="界面语言">
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
          <SettingsSection title="操作历史">
            <SettingItem icon={History} label="保存操作历史">
              <SettingSwitch
                checked={settings.saveOperationHistory}
                onChange={(checked) => updateSettings('saveOperationHistory', checked)}
              />
            </SettingItem>
            <div className="px-5 py-2 text-[11px] text-[#999999] font-body">
              开启后将记录您在编辑器、代码生成器的设置，下次使用时自动恢复
            </div>
          </SettingsSection>

          {/* [截图设置] */}
          <SettingsSection title="截图设置">
            <SettingItem icon={Clock} label="延迟截图时间">
              <SettingSelect
                value={String(settings.delayTime)}
                options={[
                  { value: '3', label: '3秒' },
                  { value: '5', label: '5秒' },
                  { value: '10', label: '10秒' },
                ]}
                onChange={(value) => updateSettings('delayTime', Number(value) as typeof settings.delayTime)}
              />
            </SettingItem>
            <SettingItem icon={Database} label="历史保留天数">
              <SettingSelect
                value={String(settings.historyRetention)}
                options={Object.entries(HISTORY_RETENTION_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                onChange={(value) => updateSettings('historyRetention', Number(value) as typeof settings.historyRetention)}
              />
            </SettingItem>
          </SettingsSection>

          {/* [水印设置] */}
          <SettingsSection title="水印设置">
            <SettingItem icon={Droplet} label="默认添加水印">
              <SettingSwitch
                checked={settings.watermarkEnabled}
                onChange={(checked) => updateSettings('watermarkEnabled', checked)}
              />
            </SettingItem>
            <SettingItem icon={Type} label="水印文字">
              <SettingInput
                value={settings.watermarkText}
                onChange={(value) => updateSettings('watermarkText', value)}
                placeholder="输入水印文字"
              />
            </SettingItem>
            <SettingItem icon={Droplet} label="水印透明度">
              <SettingSlider
                value={settings.watermarkOpacity}
                onChange={(value) => updateSettings('watermarkOpacity', value)}
                min={0}
                max={100}
                unit="%"
              />
            </SettingItem>
          </SettingsSection>

          {/* [代码美化] */}
          <SettingsSection title="代码美化">
            <SettingItem icon={Code2} label="代码主题">
              <SettingSelect
                value={settings.codeTheme}
                options={CODE_THEME_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
                onChange={(value) => updateSettings('codeTheme', value)}
              />
            </SettingItem>
            <SettingItem icon={Type} label="字体大小">
              <SettingSlider
                value={settings.codeFontSize}
                onChange={(value) => updateSettings('codeFontSize', value)}
                min={12}
                max={24}
                unit="px"
              />
            </SettingItem>
            <SettingItem icon={Hash} label="显示行号">
              <SettingSwitch
                checked={settings.codeShowLineNumbers}
                onChange={(checked) => updateSettings('codeShowLineNumbers', checked)}
              />
            </SettingItem>
          </SettingsSection>

          {/* [快捷键] */}
          <SettingsSection title="快捷键">
            <SettingItem icon={Camera} label="截图">
              <ShortcutDisplay keys={['Alt', 'Shift', 'S']} />
            </SettingItem>
            <SettingItem icon={Terminal} label="代码编辑器">
              <ShortcutDisplay keys={['Alt', 'Shift', 'C']} />
            </SettingItem>
            <div className="px-5 py-2 text-[11px] text-[#999999] font-body">
              快捷键可在 Chrome 扩展管理页面中自定义配置
            </div>
          </SettingsSection>

          {/* [关于] */}
          <SettingsSection title="关于">
            <div className="px-5 py-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#999999] font-body">版本</span>
                <span className="text-[13px] text-[#1A1A1A] font-body">
                  {EXTENSION_VERSION}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#999999] font-body">作者</span>
                <span className="text-[13px] text-[#1A1A1A] font-body">
                  {EXTENSION_AUTHOR}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[13px] text-[#999999] font-body">仓库</span>
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
