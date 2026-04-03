/**
 * SliderControl 组件
 * 滑块控件
 */

import React from 'react';

interface SliderControlProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  displayValue: string;
  onChange: (v: number) => void;
}

export const SliderControl: React.FC<SliderControlProps> = ({
  min,
  max,
  step = 1,
  value,
  displayValue,
  onChange,
}) => (
  <div className="w-full flex items-center gap-2">
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="flex-1 h-1"
      style={{ accentColor: 'var(--color-field-focus)' }}
    />
    <span
      className="text-[10px] w-8 text-right tabular-nums shrink-0"
      style={{ color: '#666' }}
    >
      {displayValue}
    </span>
  </div>
);
