import React from 'react';
import { cn } from '@shared/lib/utils';

interface SettingSelectProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}

export const SettingSelect: React.FC<SettingSelectProps> = ({
  value,
  options,
  onChange,
  className,
}) => {
  return (
    <div
      className={cn(
        'h-[30px] rounded-lg px-3 flex items-center gap-2 cursor-pointer',
        className
      )}
      style={{
        background: '#F0F0F0',
      }}
    >
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-[12px] text-[#1A1A1A] font-body outline-none cursor-pointer appearance-none pr-4"
        style={{ minWidth: '60px' }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg
        className="w-[14px] h-[14px] text-[#777777] -ml-3 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
  );
};
