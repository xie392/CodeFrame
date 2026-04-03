import React from 'react';
import { cn } from '@shared/lib/utils';

interface SettingSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  unit?: string;
  className?: string;
}

export const SettingSlider: React.FC<SettingSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  unit = '',
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-[80px] h-1 cursor-pointer"
        style={{ accentColor: '#6366f1' }}
      />
      <span className="text-[12px] text-[#1A1A1A] font-body w-10 text-right tabular-nums">
        {value}{unit}
      </span>
    </div>
  );
};
