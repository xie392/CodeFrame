/**
 * LeftPanel 组件
 * 左侧控制面板
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Check,
  ClipboardCopy,
  Image,
  Palette,
  Settings2,
} from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@shared/components/ui/tooltip';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@shared/components/ui/popover';
import { Input } from '@shared/components/ui/input';
import { Select } from '@shared/components/ui/select';
import { Slider } from '@shared/components/ui/slider';
import { Switch } from '@shared/components/ui/switch';
import { useCodegenStore, useCurrentFont } from '../stores/codegen-store';
import { isUniformPadding } from '../utils/layout';
import { THEMES } from '../config/themes';
import { BACKGROUNDS } from '../config/backgrounds';
import { MAX_PADDING_VALUE, MAX_BORDER_RADIUS } from '../constants';
import { PaddingInput } from './PaddingInput';
import { SectionLabel } from './SectionLabel';
import { SliderControl } from './SliderControl';

interface LeftPanelProps {
  isExporting: boolean;
  copied: boolean;
  onExport: () => void;
  onCopy: () => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  isExporting,
  copied,
  onExport,
  onCopy,
}) => {
  const { t } = useTranslation('codegen');

  const {
    theme,
    window: windowState,
    editor,
    watermark: watermarkState,
    setTheme,
    setWindow,
    setEditor,
    setWatermark,
  } = useCodegenStore();

  const selectedFontConfig = useCurrentFont();

  return (
    <aside
      className="w-[240px] h-full shrink-0 flex flex-col gap-3 p-4 overflow-y-auto"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* 主题选择器 */}
      <div className="flex flex-col gap-2 shrink-0">
        <SectionLabel>{t('label.theme')}</SectionLabel>
        <Select
          value={theme.selectedTheme}
          onChange={(e) => setTheme({ selectedTheme: e.target.value })}
          selectSize="sm"
        >
          {THEMES.map((themeItem) => (
            <option key={themeItem.id} value={themeItem.id}>
              {themeItem.label}
            </option>
          ))}
        </Select>
      </div>

      {/* 背景色选择器 */}
      <div className="flex flex-col gap-2 shrink-0">
        <SectionLabel>{t('label.background')}</SectionLabel>
        <TooltipProvider delayDuration={300}>
          <div className="w-full grid grid-cols-6 gap-1.5">
            {BACKGROUNDS.map((bg) => (
              <Tooltip key={bg.id}>
                <TooltipTrigger asChild>
                  <button
                    className="w-full aspect-square shrink-0 rounded-full relative overflow-hidden"
                    style={{
                      background: bg.preview,
                      border:
                        theme.selectedBg === bg.id
                          ? '2px solid var(--color-field-focus)'
                          : '2px solid #d1d5db',
                    }}
                    onClick={() => setTheme({ selectedBg: bg.id })}
                  >
                    {theme.selectedBg === bg.id && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="w-3 h-3 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: 'rgba(255,255,255,0.9)',
                          }}
                        >
                          <Check size={8} style={{ color: '#333' }} />
                        </div>
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{bg.label}</TooltipContent>
              </Tooltip>
            ))}
            {/* 自定义颜色 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <label
                  className="w-full aspect-square shrink-0 rounded-full flex items-center justify-center cursor-pointer relative overflow-hidden"
                  style={{
                    border:
                      theme.selectedBg === 'custom'
                        ? '2px solid var(--color-field-focus)'
                        : '2px solid #d1d5db',
                  }}
                >
                  <Palette
                    size={12}
                    style={{ color: '#999', pointerEvents: 'none' }}
                  />
                  <input
                    type="color"
                    value={theme.customBgColor}
                    onChange={(e) => {
                      setTheme({
                        customBgColor: e.target.value,
                        selectedBg: 'custom',
                      });
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
              </TooltipTrigger>
              <TooltipContent>{t('label.customColor')}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Padding 选择器 */}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <SectionLabel>{t('label.padding')}</SectionLabel>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/5 transition-colors"
                style={{
                  color: isUniformPadding(windowState.padding)
                    ? '#999'
                    : '#FF6B35',
                }}
              >
                <Settings2 size={12} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              sideOffset={8}
              className="w-auto !p-3 !rounded-lg"
              style={{
                backgroundColor: '#fff',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <div className="grid grid-cols-3 gap-2 w-[140px]">
                <div />
                <PaddingInput
                  label={t('padding.top')}
                  value={windowState.padding.top}
                  onChange={(v) =>
                    setWindow({
                      padding: { ...windowState.padding, top: v },
                    })
                  }
                />
                <div />
                <PaddingInput
                  label={t('padding.left')}
                  value={windowState.padding.left}
                  onChange={(v) =>
                    setWindow({
                      padding: { ...windowState.padding, left: v },
                    })
                  }
                />
                <button
                  className="w-full h-6 flex items-center justify-center rounded text-[10px] hover:bg-black/5 transition-colors"
                  style={{ color: '#999' }}
                  onClick={() =>
                    setWindow({
                      padding: { top: 0, right: 0, bottom: 0, left: 0 },
                    })
                  }
                >
                  0
                </button>
                <PaddingInput
                  label={t('padding.right')}
                  value={windowState.padding.right}
                  onChange={(v) =>
                    setWindow({
                      padding: { ...windowState.padding, right: v },
                    })
                  }
                />
                <div />
                <PaddingInput
                  label={t('padding.bottom')}
                  value={windowState.padding.bottom}
                  onChange={(v) =>
                    setWindow({
                      padding: { ...windowState.padding, bottom: v },
                    })
                  }
                />
                <div />
              </div>
              {!isUniformPadding(windowState.padding) && (
                <button
                  className="w-full mt-2 pt-2 text-[10px] text-center hover:bg-black/5 rounded transition-colors"
                  style={{
                    color: '#999',
                    borderTop: '1px solid rgba(0,0,0,0.06)',
                  }}
                  onClick={() =>
                    setWindow({
                      padding: {
                        top: windowState.padding.top,
                        right: windowState.padding.top,
                        bottom: windowState.padding.top,
                        left: windowState.padding.top,
                      },
                    })
                  }
                >
                  {t('label.uniformAs')} {windowState.padding.top}
                </button>
              )}
            </PopoverContent>
          </Popover>
        </div>
        <SliderControl
          min={0}
          max={MAX_PADDING_VALUE}
          value={
            isUniformPadding(windowState.padding) ? windowState.padding.top : -1
          }
          displayValue={
            isUniformPadding(windowState.padding)
              ? `${windowState.padding.top}`
              : '···'
          }
          onChange={(v) =>
            setWindow({ padding: { top: v, right: v, bottom: v, left: v } })
          }
        />
      </div>

      {/* 窗口视觉控制 */}
      <div className="flex flex-col gap-2 shrink-0">
        <SectionLabel>{t('label.window')}</SectionLabel>
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: '#999' }}>
            {t('label.titleBar')}
          </span>
          <Switch
            checked={windowState.showHeader}
            onChange={(v) => setWindow({ showHeader: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: '#999' }}>
            {t('label.lineNumbers')}
          </span>
          <Switch
            checked={editor.showLineNumbers}
            onChange={(v) => setEditor({ showLineNumbers: v })}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: '#999' }}>
            {t('label.shadow')}
          </span>
          <Switch
            checked={windowState.shadowEnabled}
            onChange={(v) => setWindow({ shadowEnabled: v })}
          />
        </div>
        {windowState.shadowEnabled && (
          <Slider
            value={windowState.shadowIntensity}
            onChange={(v) => setWindow({ shadowIntensity: v })}
            min={0}
            max={100}
            unit="%"
          />
        )}
      </div>

      {/* 圆角控制 */}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <SectionLabel>{t('label.borderRadius')}</SectionLabel>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/5 transition-colors"
                style={{
                  color:
                    windowState.borderRadius.outer ===
                    windowState.borderRadius.inner
                      ? '#999'
                      : '#FF6B35',
                }}
              >
                <Settings2 size={12} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              sideOffset={8}
              className="w-auto !p-3 !rounded-lg"
              style={{
                backgroundColor: '#fff',
                border: '1px solid rgba(0,0,0,0.08)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <div className="flex flex-col gap-3 w-[180px]">
                <div className="flex flex-col gap-1">
                  <span
                    className="text-[9px] leading-none"
                    style={{ color: '#999' }}
                  >
                    {t('label.outerRadius')}
                  </span>
                  <SliderControl
                    min={0}
                    max={MAX_BORDER_RADIUS}
                    value={windowState.borderRadius.outer}
                    displayValue={`${windowState.borderRadius.outer}px`}
                    onChange={(v) =>
                      setWindow({
                        borderRadius: { ...windowState.borderRadius, outer: v },
                      })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span
                    className="text-[9px] leading-none"
                    style={{ color: '#999' }}
                  >
                    {t('label.innerRadius')}
                  </span>
                  <SliderControl
                    min={0}
                    max={MAX_BORDER_RADIUS}
                    value={windowState.borderRadius.inner}
                    displayValue={`${windowState.borderRadius.inner}px`}
                    onChange={(v) =>
                      setWindow({
                        borderRadius: { ...windowState.borderRadius, inner: v },
                      })
                    }
                  />
                </div>
                {windowState.borderRadius.outer !==
                  windowState.borderRadius.inner && (
                  <button
                    className="w-full pt-2 text-[10px] text-center hover:bg-black/5 rounded transition-colors"
                    style={{
                      color: '#999',
                      borderTop: '1px solid rgba(0,0,0,0.06)',
                    }}
                    onClick={() => {
                      const avg = Math.round(
                        (windowState.borderRadius.outer +
                          windowState.borderRadius.inner) /
                          2,
                      );
                      setWindow({ borderRadius: { outer: avg, inner: avg } });
                    }}
                  >
                    {t('label.uniformAs')}{' '}
                    {Math.round(
                      (windowState.borderRadius.outer +
                        windowState.borderRadius.inner) /
                        2,
                    )}
                    px
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <SliderControl
          min={0}
          max={MAX_BORDER_RADIUS}
          value={
            windowState.borderRadius.outer === windowState.borderRadius.inner
              ? windowState.borderRadius.inner
              : Math.round(
                  (windowState.borderRadius.outer +
                    windowState.borderRadius.inner) /
                    2,
                )
          }
          displayValue={
            windowState.borderRadius.outer === windowState.borderRadius.inner
              ? `${windowState.borderRadius.inner}px`
              : '···'
          }
          onChange={(v) =>
            setWindow({ borderRadius: { outer: v, inner: v } })
          }
        />
      </div>

      {/* 字体选择器 */}
      <div className="flex flex-col gap-2 shrink-0">
        <SectionLabel>{t('label.font')}</SectionLabel>
        <div className="w-full flex flex-col gap-1.5">
          <Select
            value={editor.selectedFont}
            onChange={(e) => setEditor({ selectedFont: e.target.value })}
            selectSize="sm"
            style={{ fontFamily: selectedFontConfig.family }}
          >
            {[
              { id: 'jetbrains', label: 'JetBrains Mono' },
              { id: 'fira-code', label: 'Fira Code' },
              { id: 'source-code-pro', label: 'Source Code Pro' },
              { id: 'ibm-plex', label: 'IBM Plex Mono' },
            ].map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </Select>
          <Slider
            value={editor.fontSize}
            onChange={(v) => setEditor({ fontSize: v })}
            min={12}
            max={24}
            unit="px"
          />
        </div>
      </div>

      {/* 水印 */}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <SectionLabel>{t('label.watermark')}</SectionLabel>
          <Switch
            checked={watermarkState.enabled}
            onChange={(v) => setWatermark({ enabled: v })}
          />
        </div>
        {watermarkState.enabled && (
          <>
            <Input
              type="text"
              value={watermarkState.text}
              onChange={(e) => setWatermark({ text: e.target.value })}
              placeholder={t('hint.watermarkPlaceholder')}
              inputSize="sm"
            />
            <Slider
              value={watermarkState.opacity}
              onChange={(v) => setWatermark({ opacity: v })}
              min={10}
              max={90}
              unit="%"
            />
          </>
        )}
      </div>

      {/* 占位 */}
      <div className="flex-1" />

      {/* 导出按钮组 */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onExport}
          disabled={isExporting}
          className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-field-focus)' }}
        >
          <Image size={16} style={{ color: '#FFFFFF' }} />
          <span
            className="text-[13px] font-semibold leading-none"
            style={{ color: '#FFFFFF' }}
          >
            {isExporting ? t('action.exporting') : t('action.export')}
          </span>
        </button>
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onCopy}
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                style={{ backgroundColor: 'rgba(0,0,0,0.08)' }}
              >
                {copied ? (
                  <Check
                    size={16}
                    style={{ color: 'var(--color-field-focus)' }}
                  />
                ) : (
                  <ClipboardCopy
                    size={16}
                    style={{ color: 'var(--color-field-focus)' }}
                  />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={8}>
              <p className="text-[12px]">
                {copied ? t('hint.copied') : t('action.copyToClipboard')}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
};
