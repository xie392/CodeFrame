import React from 'react';
import { useTranslation } from 'react-i18next';
import { SHADOW_PRESETS } from '../../constants';

interface ShadowPresetButtonProps {
  preset: (typeof SHADOW_PRESETS)[number];
  isSelected: boolean;
  onClick: () => void;
}

export const ShadowPresetButton: React.FC<ShadowPresetButtonProps> = ({
  preset,
  isSelected,
  onClick,
}) => {
  const { t } = useTranslation('editor');

  return (
    <button
      onClick={onClick}
      className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
        isSelected ? 'bg-[var(--color-accent)] text-black' : 'prop-field-sm'
      }`}
    >
      <span className="text-[10px] font-body leading-none">
        {t(preset.name)}
      </span>
    </button>
  );
};

export default ShadowPresetButton;
