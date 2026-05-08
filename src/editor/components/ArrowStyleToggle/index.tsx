import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { ArrowStyle } from '../../types';

interface ArrowStyleToggleProps {
  style: ArrowStyle;
  onChange: (style: ArrowStyle) => void;
}

export const ArrowStyleToggle: React.FC<ArrowStyleToggleProps> = ({
  style,
  onChange,
}) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] text-(--color-editor-hint) font-body leading-none">
      arrow:
    </span>
    <div className="flex gap-1">
      <button
        onClick={() => onChange('single')}
        className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
          style === 'single'
            ? 'bg-[var(--color-accent)] text-black'
            : 'prop-field-sm'
        }`}
      >
        <ChevronRight size={14} />
        <span className="text-[11px] font-body leading-none">single</span>
      </button>
      <button
        onClick={() => onChange('double')}
        className={`h-[28px] px-3 rounded-[6px] flex items-center gap-1 cursor-pointer transition-colors ${
          style === 'double'
            ? 'bg-[var(--color-accent)] text-black'
            : 'prop-field-sm'
        }`}
      >
        <ChevronRight size={14} className="rotate-180" />
        <ChevronRight size={14} />
        <span className="text-[11px] font-body leading-none">double</span>
      </button>
    </div>
  </div>
);

export default ArrowStyleToggle;
