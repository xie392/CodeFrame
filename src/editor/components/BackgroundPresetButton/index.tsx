import React from 'react';
import { useTranslation } from 'react-i18next';
import { BACKGROUND_PRESETS } from '../../constants';

interface BackgroundPresetButtonProps {
  preset: (typeof BACKGROUND_PRESETS)[number];
  isSelected: boolean;
  onClick: () => void;
}

export const BackgroundPresetButton: React.FC<BackgroundPresetButtonProps> = ({
  preset,
  isSelected,
  onClick,
}) => {
  const { t } = useTranslation('editor');

  const getBackground = () => {
    if (preset.type === 'solid') {
      return preset.color === 'transparent'
        ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
        : preset.color;
    }
    return `linear-gradient(${preset.gradientAngle}deg, ${preset.gradientColors[0]}, ${preset.gradientColors[1]})`;
  };

  return (
    <button
      onClick={onClick}
      className={`w-[24px] h-[24px] rounded-[4px] shrink-0 cursor-pointer border-2 transition-colors ${
        isSelected ? 'border-[var(--color-accent)]' : 'border-transparent'
      }`}
      style={{
        background: getBackground(),
        backgroundSize: preset.color === 'transparent' ? '8px 8px' : 'auto',
        backgroundPosition:
          preset.color === 'transparent'
            ? '0 0, 0 4px, 4px -4px, -4px 0px'
            : 'auto',
      }}
      title={t(preset.name)}
    />
  );
};

export default BackgroundPresetButton;
