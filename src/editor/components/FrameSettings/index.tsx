import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ImageFrameSettings } from '../../types';
import { BORDER_RADIUS_PRESETS } from '../../types';
import {
  PRESET_COLORS,
  BACKGROUND_PRESETS,
  SHADOW_PRESETS,
  IMAGE_SHADOW_PRESETS,
  ASPECT_RATIO_PRESETS,
} from '../../constants';
import { CollapsibleSection } from '../CollapsibleSection';
import { ColorPicker } from '../ColorPicker';
import { SliderControl } from '../SliderControl';
import { EditableField } from '../EditableField';
import { SelectControl } from '../SelectControl';
import { BackgroundPresetButton } from '../BackgroundPresetButton';
import { ShadowPresetButton } from '../ShadowPresetButton';
import { ImageShadowPresetButton } from '../ImageShadowPresetButton';

interface FrameSettingsProps {
  settings: ImageFrameSettings;
  onUpdate: (updates: Partial<ImageFrameSettings>) => void;
  collapsedSections?: Record<string, boolean>;
  onCollapsedChange?: (sections: Record<string, boolean>) => void;
}

export const FrameSettings: React.FC<FrameSettingsProps> = ({
  settings,
  onUpdate,
  collapsedSections,
  onCollapsedChange,
}) => {
  const { t } = useTranslation('editor');

  const handleSectionToggle = (key: string, open: boolean) => {
    if (onCollapsedChange) {
      onCollapsedChange({ ...collapsedSections, [key]: !open });
    }
  };

  const isSectionOpen = (key: string) => !(collapsedSections?.[key] ?? false);

  return (
    <div className="flex flex-col gap-3">
      {/* 背景设置 */}
      <CollapsibleSection
        title={t('label.background')}
        open={isSectionOpen('background')}
        onOpenChange={(open) => handleSectionToggle('background', open)}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
            type:
          </span>
          <SelectControl
            value={settings.background.type}
            options={[
              { name: t('backgroundType.solid'), value: 'solid' },
              { name: t('backgroundType.gradient'), value: 'linear' },
              { name: t('backgroundType.gradient'), value: 'radial' },
            ]}
            onChange={(type) =>
              onUpdate({
                background: {
                  ...settings.background,
                  type: type as 'solid' | 'linear' | 'radial',
                },
              })
            }
          />
        </div>
        {settings.background.type === 'solid' ? (
          <ColorPicker
            color={settings.background.color}
            onChange={(color) =>
              onUpdate({ background: { ...settings.background, color } })
            }
          />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
                {t('backgroundType.startColor')}:
              </span>
              <div className="flex gap-1">
                {PRESET_COLORS.slice(0, 4).map((color) => (
                  <button
                    key={color}
                    onClick={() =>
                      onUpdate({
                        background: {
                          ...settings.background,
                          gradientColors: [
                            color,
                            settings.background.gradientColors[1],
                          ],
                        },
                      })
                    }
                    className="w-[20px] h-[20px] rounded-[4px] shrink-0 cursor-pointer border border-[var(--color-border)]"
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={settings.background.gradientColors[0]}
                  onChange={(e) =>
                    onUpdate({
                      background: {
                        ...settings.background,
                        gradientColors: [
                          e.target.value,
                          settings.background.gradientColors[1],
                        ],
                      },
                    })
                  }
                  className="w-[20px] h-[20px] rounded-[4px] cursor-pointer bg-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
                {t('backgroundType.endColor')}:
              </span>
              <div className="flex gap-1">
                {PRESET_COLORS.slice(0, 4).map((color) => (
                  <button
                    key={color}
                    onClick={() =>
                      onUpdate({
                        background: {
                          ...settings.background,
                          gradientColors: [
                            settings.background.gradientColors[0],
                            color,
                          ],
                        },
                      })
                    }
                    className="w-[20px] h-[20px] rounded-[4px] shrink-0 cursor-pointer border border-[var(--color-border)]"
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={settings.background.gradientColors[1]}
                  onChange={(e) =>
                    onUpdate({
                      background: {
                        ...settings.background,
                        gradientColors: [
                          settings.background.gradientColors[0],
                          e.target.value,
                        ],
                      },
                    })
                  }
                  className="w-[20px] h-[20px] rounded-[4px] cursor-pointer bg-transparent"
                />
              </div>
            </div>
            <SliderControl
              label={t('label.angle')}
              value={settings.background.gradientAngle}
              min={0}
              max={360}
              onChange={(gradientAngle) =>
                onUpdate({
                  background: { ...settings.background, gradientAngle },
                })
              }
            />
          </>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {BACKGROUND_PRESETS.map((preset) => (
            <BackgroundPresetButton
              key={preset.name}
              preset={preset}
              isSelected={
                preset.type === settings.background.type &&
                (preset.type === 'solid'
                  ? preset.color === settings.background.color
                  : preset.gradientColors?.[0] ===
                      settings.background.gradientColors[0] &&
                    preset.gradientColors?.[1] ===
                      settings.background.gradientColors[1])
              }
              onClick={() => {
                if (preset.type === 'solid') {
                  onUpdate({
                    background: {
                      ...settings.background,
                      type: 'solid',
                      color: preset.color,
                    },
                  });
                } else {
                  onUpdate({
                    background: {
                      ...settings.background,
                      type: 'linear',
                      gradientColors: preset.gradientColors,
                      gradientAngle: preset.gradientAngle,
                    },
                  });
                }
              }}
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* 边距设置 */}
      <CollapsibleSection
        title={t('label.padding')}
        open={isSectionOpen('padding')}
        onOpenChange={(open) => handleSectionToggle('padding', open)}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onUpdate({
                padding: {
                  ...settings.padding,
                  linked: !settings.padding.linked,
                },
              })
            }
            className={`w-[20px] h-[20px] rounded-[4px] flex items-center justify-center cursor-pointer transition-colors ${
              settings.padding.linked
                ? 'bg-[var(--color-accent)] text-black'
                : 'prop-field-sm'
            }`}
            title={settings.padding.linked ? 'Unlink' : 'Link'}
          >
            <span className="text-[10px] font-body leading-none">
              {settings.padding.linked ? '🔗' : '⛓️‍💥'}
            </span>
          </button>
          <div className="flex gap-1 flex-1">
            <EditableField
              label={t('direction.top')}
              value={settings.padding.top}
              onChange={(top) =>
                onUpdate({
                  padding: settings.padding.linked
                    ? { ...settings.padding, top, right: top, bottom: top, left: top }
                    : { ...settings.padding, top },
                })
              }
            />
            <EditableField
              label={t('direction.right')}
              value={settings.padding.right}
              onChange={(right) =>
                onUpdate({
                  padding: settings.padding.linked
                    ? { ...settings.padding, top: right, right, bottom: right, left: right }
                    : { ...settings.padding, right },
                })
              }
            />
          </div>
        </div>
        <div className="flex gap-1 pl-7">
          <EditableField
            label={t('direction.bottom')}
            value={settings.padding.bottom}
            onChange={(bottom) =>
              onUpdate({
                padding: settings.padding.linked
                  ? { ...settings.padding, top: bottom, right: bottom, bottom, left: bottom }
                  : { ...settings.padding, bottom },
              })
            }
          />
          <EditableField
            label={t('direction.left')}
            value={settings.padding.left}
            onChange={(left) =>
              onUpdate({
                padding: settings.padding.linked
                  ? { ...settings.padding, top: left, right: left, bottom: left, left }
                  : { ...settings.padding, left },
              })
            }
          />
        </div>
      </CollapsibleSection>

      {/* 容器圆角设置 */}
      <CollapsibleSection
        title={t('label.borderRadius')}
        open={isSectionOpen('borderRadius')}
        onOpenChange={(open) => handleSectionToggle('borderRadius', open)}
      >
        {/* 圆角预设 */}
        <div className="mb-3">
          <div className="flex gap-1 flex-wrap">
            {BORDER_RADIUS_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  onUpdate({
                    borderRadius: {
                      ...settings.borderRadius,
                      unit: 'px',
                      topLeft: preset.value,
                      topRight: preset.value,
                      bottomRight: preset.value,
                      bottomLeft: preset.value,
                      linked: true,
                    },
                  });
                }}
                className={`px-2 py-1 text-[10px] rounded transition-colors ${
                  settings.borderRadius.linked &&
                  settings.borderRadius.unit === 'px' &&
                  settings.borderRadius.topLeft === preset.value
                    ? 'bg-[var(--color-accent)] text-black'
                    : 'prop-field-sm hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                {t(preset.name)}
              </button>
            ))}
          </div>
        </div>

        {/* 单位切换 */}
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => {
              const newUnit = settings.borderRadius.unit === 'px' ? '%' : 'px';
              onUpdate({
                borderRadius: { ...settings.borderRadius, unit: newUnit },
              });
            }}
            className="prop-field-sm px-2 py-1 text-[10px] flex items-center gap-1"
          >
            <span>{t('label.unit')}:</span>
            <span className="text-[var(--color-accent)]">
              {settings.borderRadius.unit}
            </span>
          </button>
        </div>

        {/* 统一/独立模式切换 */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() =>
              onUpdate({
                borderRadius: {
                  ...settings.borderRadius,
                  linked: !settings.borderRadius.linked,
                },
              })
            }
            className={`w-6 h-6 flex items-center justify-center rounded text-[10px] transition-colors ${
              settings.borderRadius.linked
                ? 'bg-[var(--color-accent)] text-black'
                : 'prop-field-sm'
            }`}
            title={
              settings.borderRadius.linked ? '切换为独立模式' : '切换为统一模式'
            }
          >
            {settings.borderRadius.linked ? '🔗' : '⛓️‍💥'}
          </button>
        </div>

        {/* 圆角值输入 */}
        {settings.borderRadius.linked ? (
          <SliderControl
            label={t('label.borderRadius')}
            value={settings.borderRadius.topLeft}
            min={0}
            max={settings.borderRadius.unit === 'px' ? 100 : 50}
            onChange={(value) =>
              onUpdate({
                borderRadius: {
                  ...settings.borderRadius,
                  topLeft: value,
                  topRight: value,
                  bottomRight: value,
                  bottomLeft: value,
                },
              })
            }
          />
        ) : (
          <div className="space-y-1">
            <div className="flex gap-1">
              <EditableField
                label={t('corner.topLeft')}
                value={settings.borderRadius.topLeft}
                onChange={(topLeft) =>
                  onUpdate({
                    borderRadius: { ...settings.borderRadius, topLeft },
                  })
                }
              />
              <EditableField
                label={t('corner.topRight')}
                value={settings.borderRadius.topRight}
                onChange={(topRight) =>
                  onUpdate({
                    borderRadius: { ...settings.borderRadius, topRight },
                  })
                }
              />
            </div>
            <div className="flex gap-1 pl-7">
              <EditableField
                label={t('corner.bottomLeft')}
                value={settings.borderRadius.bottomLeft}
                onChange={(bottomLeft) =>
                  onUpdate({
                    borderRadius: { ...settings.borderRadius, bottomLeft },
                  })
                }
              />
              <EditableField
                label={t('corner.bottomRight')}
                value={settings.borderRadius.bottomRight}
                onChange={(bottomRight) =>
                  onUpdate({
                    borderRadius: { ...settings.borderRadius, bottomRight },
                  })
                }
              />
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* 图片圆角设置 */}
      <CollapsibleSection
        title={t('label.imageRadius')}
        open={isSectionOpen('imageRadius')}
        onOpenChange={(open) => handleSectionToggle('imageRadius', open)}
      >
        {/* 圆角预设 */}
        <div className="mb-3">
          <div className="flex gap-1 flex-wrap">
            {BORDER_RADIUS_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  onUpdate({
                    imageRadius: {
                      ...settings.imageRadius,
                      unit: 'px',
                      topLeft: preset.value,
                      topRight: preset.value,
                      bottomRight: preset.value,
                      bottomLeft: preset.value,
                      linked: true,
                    },
                  });
                }}
                className={`px-2 py-1 text-[10px] rounded transition-colors ${
                  settings.imageRadius.linked &&
                  settings.imageRadius.unit === 'px' &&
                  settings.imageRadius.topLeft === preset.value
                    ? 'bg-[var(--color-accent)] text-black'
                    : 'prop-field-sm hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                {t(preset.name)}
              </button>
            ))}
          </div>
        </div>

        {/* 单位切换 */}
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => {
              const newUnit = settings.imageRadius.unit === 'px' ? '%' : 'px';
              onUpdate({
                imageRadius: { ...settings.imageRadius, unit: newUnit },
              });
            }}
            className="prop-field-sm px-2 py-1 text-[10px] flex items-center gap-1"
          >
            <span>{t('label.unit')}:</span>
            <span className="text-[var(--color-accent)]">
              {settings.imageRadius.unit}
            </span>
          </button>
        </div>

        {/* 统一/独立模式切换 */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() =>
              onUpdate({
                imageRadius: {
                  ...settings.imageRadius,
                  linked: !settings.imageRadius.linked,
                },
              })
            }
            className={`w-6 h-6 flex items-center justify-center rounded text-[10px] transition-colors ${
              settings.imageRadius.linked
                ? 'bg-[var(--color-accent)] text-black'
                : 'prop-field-sm'
            }`}
            title={
              settings.imageRadius.linked ? '切换为独立模式' : '切换为统一模式'
            }
          >
            {settings.imageRadius.linked ? '🔗' : '⛓️‍💥'}
          </button>
        </div>

        {/* 圆角值输入 */}
        {settings.imageRadius.linked ? (
          <SliderControl
            label={t('label.borderRadius')}
            value={settings.imageRadius.topLeft}
            min={0}
            max={settings.imageRadius.unit === 'px' ? 100 : 50}
            onChange={(value) =>
              onUpdate({
                imageRadius: {
                  ...settings.imageRadius,
                  topLeft: value,
                  topRight: value,
                  bottomRight: value,
                  bottomLeft: value,
                },
              })
            }
          />
        ) : (
          <div className="space-y-1">
            <div className="flex gap-1">
              <EditableField
                label={t('corner.topLeft')}
                value={settings.imageRadius.topLeft}
                onChange={(topLeft) =>
                  onUpdate({ imageRadius: { ...settings.imageRadius, topLeft } })
                }
              />
              <EditableField
                label={t('corner.topRight')}
                value={settings.imageRadius.topRight}
                onChange={(topRight) =>
                  onUpdate({ imageRadius: { ...settings.imageRadius, topRight } })
                }
              />
            </div>
            <div className="flex gap-1 pl-7">
              <EditableField
                label={t('corner.bottomLeft')}
                value={settings.imageRadius.bottomLeft}
                onChange={(bottomLeft) =>
                  onUpdate({
                    imageRadius: { ...settings.imageRadius, bottomLeft },
                  })
                }
              />
              <EditableField
                label={t('corner.bottomRight')}
                value={settings.imageRadius.bottomRight}
                onChange={(bottomRight) =>
                  onUpdate({
                    imageRadius: { ...settings.imageRadius, bottomRight },
                  })
                }
              />
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* 阴影设置 */}
      <CollapsibleSection
        title={t('section.shadow')}
        open={isSectionOpen('shadow')}
        onOpenChange={(open) => handleSectionToggle('shadow', open)}
        enabled={settings.shadow.enabled}
        onToggle={(enabled) =>
          onUpdate({ shadow: { ...settings.shadow, enabled } })
        }
      >
        <ColorPicker
          color={settings.shadow.color}
          onChange={(color) =>
            onUpdate({ shadow: { ...settings.shadow, color } })
          }
        />
        <SliderControl
          label={t('label.blur')}
          value={settings.shadow.blur}
          min={0}
          max={100}
          onChange={(blur) =>
            onUpdate({ shadow: { ...settings.shadow, blur } })
          }
        />
        <div className="flex gap-2">
          <EditableField
            label="X"
            value={settings.shadow.offsetX}
            onChange={(offsetX) =>
              onUpdate({ shadow: { ...settings.shadow, offsetX } })
            }
          />
          <EditableField
            label="Y"
            value={settings.shadow.offsetY}
            onChange={(offsetY) =>
              onUpdate({ shadow: { ...settings.shadow, offsetY } })
            }
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {SHADOW_PRESETS.map((preset) => (
            <ShadowPresetButton
              key={preset.name}
              preset={preset}
              isSelected={
                settings.shadow.enabled === preset.enabled &&
                settings.shadow.blur === preset.blur
              }
              onClick={() =>
                onUpdate({
                  shadow: {
                    ...settings.shadow,
                    enabled: preset.enabled,
                    blur: preset.blur,
                    offsetX: preset.offsetX,
                    offsetY: preset.offsetY,
                  },
                })
              }
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* 图片阴影设置 */}
      <CollapsibleSection
        title={t('section.imageShadow')}
        open={isSectionOpen('imageShadow')}
        onOpenChange={(open) => handleSectionToggle('imageShadow', open)}
        enabled={settings.imageShadow.enabled}
        onToggle={(enabled) =>
          onUpdate({ imageShadow: { ...settings.imageShadow, enabled } })
        }
      >
        <ColorPicker
          color={settings.imageShadow.color}
          onChange={(color) =>
            onUpdate({ imageShadow: { ...settings.imageShadow, color } })
          }
        />
        <SliderControl
          label={t('label.blur')}
          value={settings.imageShadow.blur}
          min={0}
          max={100}
          onChange={(blur) =>
            onUpdate({ imageShadow: { ...settings.imageShadow, blur } })
          }
        />
        <div className="flex gap-2">
          <EditableField
            label="X"
            value={settings.imageShadow.offsetX}
            onChange={(offsetX) =>
              onUpdate({ imageShadow: { ...settings.imageShadow, offsetX } })
            }
          />
          <EditableField
            label="Y"
            value={settings.imageShadow.offsetY}
            onChange={(offsetY) =>
              onUpdate({ imageShadow: { ...settings.imageShadow, offsetY } })
            }
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {IMAGE_SHADOW_PRESETS.map((preset) => (
            <ImageShadowPresetButton
              key={preset.name}
              preset={preset}
              isSelected={
                settings.imageShadow.enabled === preset.enabled &&
                settings.imageShadow.blur === preset.blur
              }
              onClick={() =>
                onUpdate({
                  imageShadow: {
                    ...settings.imageShadow,
                    enabled: preset.enabled,
                    blur: preset.blur,
                    offsetX: preset.offsetX,
                    offsetY: preset.offsetY,
                  },
                })
              }
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* 比例设置 */}
      <CollapsibleSection
        title={t('label.aspectRatio')}
        open={isSectionOpen('aspectRatio')}
        onOpenChange={(open) => handleSectionToggle('aspectRatio', open)}
      >
        <SelectControl
          value={settings.aspectRatio}
          options={ASPECT_RATIO_PRESETS}
          onChange={(aspectRatio) => onUpdate({ aspectRatio })}
        />
        {/* 自定义比例输入 */}
        {settings.aspectRatio === 'custom' && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              min="1"
              max="100"
              value={settings.customAspectRatio.width || ''}
              onChange={(e) =>
                onUpdate({
                  customAspectRatio: {
                    ...settings.customAspectRatio,
                    width: parseInt(e.target.value) || 0,
                  },
                })
              }
              placeholder={t('label.width')}
              className="prop-field-sm h-[28px] w-[60px] px-2 rounded-[6px] text-[11px] font-body text-foreground outline-none text-center"
              style={{ backgroundColor: '#FAFAFA' }}
            />
            <span className="text-[11px] text-[var(--color-editor-hint)] font-body">
              :
            </span>
            <input
              type="number"
              min="1"
              max="100"
              value={settings.customAspectRatio.height || ''}
              onChange={(e) =>
                onUpdate({
                  customAspectRatio: {
                    ...settings.customAspectRatio,
                    height: parseInt(e.target.value) || 0,
                  },
                })
              }
              placeholder={t('label.height')}
              className="prop-field-sm h-[28px] w-[60px] px-2 rounded-[6px] text-[11px] font-body text-foreground outline-none text-center"
              style={{ backgroundColor: '#FAFAFA' }}
            />
          </div>
        )}
      </CollapsibleSection>

      {/* 窗口控件设置 */}
      <CollapsibleSection
        title={t('section.windowControls')}
        open={isSectionOpen('windowControl')}
        onOpenChange={(open) => handleSectionToggle('windowControl', open)}
        enabled={settings.windowControl.enabled}
        onToggle={(enabled) =>
          onUpdate({ windowControl: { ...settings.windowControl, enabled } })
        }
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
            {t('label.windowStyle')}:
          </span>
          <div className="flex gap-1">
            <button
              onClick={() =>
                onUpdate({
                  windowControl: { ...settings.windowControl, style: 'macos' },
                })
              }
              className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
                settings.windowControl.style === 'macos'
                  ? 'bg-[var(--color-accent)] text-black'
                  : 'prop-field-sm'
              }`}
            >
              <span className="text-[11px] font-body leading-none">
                {t('windowStyle.macos')}
              </span>
            </button>
            <button
              onClick={() =>
                onUpdate({
                  windowControl: {
                    ...settings.windowControl,
                    style: 'windows',
                  },
                })
              }
              className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
                settings.windowControl.style === 'windows'
                  ? 'bg-[var(--color-accent)] text-black'
                  : 'prop-field-sm'
              }`}
            >
              <span className="text-[11px] font-body leading-none">
                {t('windowStyle.windows')}
              </span>
            </button>
          </div>
        </div>
      </CollapsibleSection>

      {/* 水印设置 */}
      <CollapsibleSection
        title={t('section.watermark')}
        open={isSectionOpen('watermark')}
        onOpenChange={(open) => handleSectionToggle('watermark', open)}
        enabled={settings.watermark.enabled}
        onToggle={(enabled) =>
          onUpdate({ watermark: { ...settings.watermark, enabled } })
        }
      >
        {/* 图片水印上传区域 */}
        <div className="mb-2">
          <div
            className={`relative border border-dashed rounded-[6px] p-2 text-center cursor-pointer transition-colors ${
              settings.watermark.imageUrl
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                : 'border-[var(--color-editor-border)] hover:border-[var(--color-accent)]'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const file = e.dataTransfer.files[0];
              if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  onUpdate({
                    watermark: {
                      ...settings.watermark,
                      imageUrl: ev.target?.result as string,
                    },
                  });
                };
                reader.readAsDataURL(file);
              }
            }}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/png,image/jpeg,image/webp';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    onUpdate({
                      watermark: {
                        ...settings.watermark,
                        imageUrl: ev.target?.result as string,
                      },
                    });
                  };
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            }}
          >
            {settings.watermark.imageUrl ? (
              <div className="flex items-center justify-center gap-2">
                <img
                  src={settings.watermark.imageUrl}
                  alt="水印图片"
                  className="h-8 max-w-16 object-contain"
                />
                <button
                  className="text-[11px] text-red-400 hover:text-red-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate({
                      watermark: { ...settings.watermark, imageUrl: null },
                    });
                  }}
                >
                  {t('action.delete')}
                </button>
              </div>
            ) : (
              <span className="text-[11px] text-[var(--color-editor-hint)] font-body">
                {t('hint.uploadWatermark')}
              </span>
            )}
          </div>
        </div>

        {/* 文字水印输入（仅在没有图片水印时显示） */}
        {!settings.watermark.imageUrl && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
              {t('label.text')}:
            </span>
            <input
              type="text"
              value={settings.watermark.text}
              onChange={(e) =>
                onUpdate({
                  watermark: { ...settings.watermark, text: e.target.value },
                })
              }
              placeholder={t('hint.watermarkPlaceholder')}
              className="prop-field-sm h-[28px] px-2 rounded-[6px] flex-1 text-[11px] font-body text-foreground outline-none"
              style={{ backgroundColor: '#FAFAFA' }}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
            {t('label.position')}:
          </span>
          <SelectControl
            value={settings.watermark.position}
            options={[
              { name: t('position.bottomRight'), value: 'bottom-right' },
              { name: t('position.bottomLeft'), value: 'bottom-left' },
              { name: t('position.topRight'), value: 'top-right' },
              { name: t('position.topLeft'), value: 'top-left' },
            ]}
            onChange={(position) =>
              onUpdate({
                watermark: {
                  ...settings.watermark,
                  position: position as ImageFrameSettings['watermark']['position'],
                },
              })
            }
          />
        </div>
        <SliderControl
          label={t('label.opacity')}
          value={settings.watermark.opacity}
          min={0}
          max={100}
          unit="%"
          onChange={(opacity) =>
            onUpdate({ watermark: { ...settings.watermark, opacity } })
          }
        />
        {settings.watermark.imageUrl ? (
          <SliderControl
            label={t('label.size')}
            value={settings.watermark.imageSize}
            min={32}
            max={200}
            unit="px"
            onChange={(imageSize) =>
              onUpdate({ watermark: { ...settings.watermark, imageSize } })
            }
          />
        ) : (
          <SliderControl
            label={t('label.size')}
            value={settings.watermark.fontSize}
            min={8}
            max={48}
            onChange={(fontSize) =>
              onUpdate({ watermark: { ...settings.watermark, fontSize } })
            }
          />
        )}
      </CollapsibleSection>
    </div>
  );
};

export default FrameSettings;
