import React from 'react';

interface FontStyleToggleProps {
  fontStyle: 'normal' | 'italic';
  onChange: (style: 'normal' | 'italic') => void;
}

export const FontStyleToggle: React.FC<FontStyleToggleProps> = ({
  fontStyle,
  onChange,
}) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none">
      style:
    </span>
    <div className="flex gap-1">
      <button
        onClick={() => onChange('normal')}
        className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
          fontStyle === 'normal'
            ? 'bg-[var(--color-accent)] text-black'
            : 'prop-field-sm'
        }`}
      >
        <span className="text-[11px] font-body leading-none">normal</span>
      </button>
      <button
        onClick={() => onChange('italic')}
        className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
          fontStyle === 'italic'
            ? 'bg-[var(--color-accent)] text-black'
            : 'prop-field-sm'
        }`}
      >
        <span className="text-[11px] font-body italic leading-none">
          italic
        </span>
      </button>
    </div>
  </div>
);

export default FontStyleToggle;
