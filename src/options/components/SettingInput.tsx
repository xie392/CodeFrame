import React from 'react';
import { cn } from '@shared/lib/utils';

interface SettingInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SettingInput: React.FC<SettingInputProps> = ({
  value,
  onChange,
  placeholder,
  className,
}) => {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'h-[30px] rounded-lg px-3 text-[12px] font-body outline-none',
        'focus:ring-2 focus:ring-[#6366f1]/20',
        className
      )}
      style={{
        background: '#F0F0F0',
        color: '#1A1A1A',
        minWidth: '120px',
      }}
    />
  );
};
