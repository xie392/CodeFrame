import React from 'react';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
}

export const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  unit = 'px',
  onChange,
}) => (
  <div className="flex items-center gap-2">
    <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none w-12">
      {label}:
    </span>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="flex-1 h-1 cursor-pointer"
      style={{ accentColor: 'var(--color-field-focus)' }}
    />
    <span className="text-[11px] text-foreground font-body leading-none w-10 text-right tabular-nums">
      {value}
      {unit}
    </span>
  </div>
);

export default SliderControl;
