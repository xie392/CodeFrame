import React from 'react';

interface FontWeightToggleProps {
  fontWeight: 'normal' | 'bold';
  onChange: (weight: 'normal' | 'bold') => void;
}

export const FontWeightToggle: React.FC<FontWeightToggleProps> = ({
  fontWeight,
  onChange,
}) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
      weight:
    </span>
    <div className="flex gap-1">
      <button
        onClick={() => onChange('normal')}
        className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
          fontWeight === 'normal'
            ? 'bg-[var(--color-accent)] text-black'
            : 'prop-field-sm'
        }`}
      >
        <span className="text-[11px] font-body leading-none">normal</span>
      </button>
      <button
        onClick={() => onChange('bold')}
        className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
          fontWeight === 'bold'
            ? 'bg-[var(--color-accent)] text-black'
            : 'prop-field-sm'
        }`}
      >
        <span className="text-[11px] font-body font-bold leading-none">
          bold
        </span>
      </button>
    </div>
  </div>
);

export default FontWeightToggle;
