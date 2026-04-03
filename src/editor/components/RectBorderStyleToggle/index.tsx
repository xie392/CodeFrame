import React from 'react';
import type { RectBorderStyle } from '../../types';

interface RectBorderStyleToggleProps {
  borderStyle: RectBorderStyle;
  onChange: (style: RectBorderStyle) => void;
}

export const RectBorderStyleToggle: React.FC<RectBorderStyleToggleProps> = ({
  borderStyle,
  onChange,
}) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
      border:
    </span>
    <div className="flex gap-1">
      <button
        onClick={() => onChange('solid')}
        className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
          borderStyle === 'solid'
            ? 'bg-[var(--color-accent)] text-black'
            : 'prop-field-sm'
        }`}
      >
        <div className="w-4 h-0.5 bg-current" />
        <span className="text-[11px] font-body leading-none">solid</span>
      </button>
      <button
        onClick={() => onChange('dashed')}
        className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
          borderStyle === 'dashed'
            ? 'bg-[var(--color-accent)] text-black'
            : 'prop-field-sm'
        }`}
      >
        <div className="w-4 h-0.5 border-t-2 border-dashed border-current" />
        <span className="text-[11px] font-body leading-none">dashed</span>
      </button>
    </div>
  </div>
);

export default RectBorderStyleToggle;
